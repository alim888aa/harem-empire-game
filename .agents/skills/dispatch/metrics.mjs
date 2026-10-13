#!/usr/bin/env node
// Mechanical facts only. No cost receipts, SQL, credentials or raw errors are
// printed or saved locally. D1 is the sole metrics store; retries replace facts.
import { execFile } from 'node:child_process';
import { readFileSync, realpathSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { canonicalizer, projectMatcher, claudeCharges, codexCharges, recentLogs, loadPrices, summarize } from './usage.mjs';
const exec = promisify(execFile);
const folder = dirname(fileURLToPath(import.meta.url));
const configPath = join(folder, 'wrangler.jsonc');
const ACTIVE = new Set(['preparing','queued','starting','running','waiting']);
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };
const inside = (p, root) => p === root || p.startsWith(root + sep);
const localDay = at => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ulaanbaatar',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
const chargeTurn = c => c.nativeRun?.id ?? c.turn ?? (c.claude ? `day-${localDay(c.at)}` : 'session');
const OVERHEAD = new Set(['manager','owner','triage','dispatch','audit','research']);
const safeError = (code) => Object.assign(new Error(code), { metricsCode: code });

async function command(bin, args, signal) {
  try { return (await exec(bin, args, { encoding:'utf8', timeout:15000, maxBuffer:32*1024*1024, signal })).stdout; }
  catch { throw safeError(`${basename(bin)}-unavailable`); }
}
export function itemId(repo, kind, number) { return `${repo}:${kind}:${number}`; }
export function upsert(table, row, preserve = []) {
  // Table/column names come only from the fixed internal schema, never GitHub.
  const keys = Object.keys(row);
  return { sql:`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${keys.filter(k => k !== 'id' && !preserve.includes(k)).map(k => `${k}=excluded.${k}`).join(',')}`,
    params:keys.map(k => row[k] ?? null) };
}
async function persist(query, statements) {
  for (let at=0;at<statements.length;at+=40) {
    const chunk = statements.slice(at,at+40);
    if (query.batch) await query.batch(chunk);
    else for (const q of chunk) await query(q.sql,q.params);
  }
}
async function atomic(query, statements) {
  if (query.batch) return query.batch(statements);
  // The non-HTTP adapter is a single SQLite connection (also used in tests).
  await query('BEGIN IMMEDIATE');
  try {
    for (const q of statements) await query(q.sql,q.params);
    await query('COMMIT');
  } catch (e) { await query('ROLLBACK'); throw e; }
}

// Read only selected metadata columns, never prompts/results or T3's shared
// provider-session row (Codex shares that process across unrelated threads).
export async function readT3(home, signal) {
  // This project vendors metrics source only; stop before local access or external writes.
  throw safeError('project-metrics-disabled');
  const path = join(home,'.t3/userdata/statev2.sqlite');
  if (!existsSync(path)) return { threads:[], natives:[], runs:[], subagents:[], prs:[], notes:['t3-metadata-missing'] };
  const query = async sql => JSON.parse((await command('sqlite3',['-readonly','-json',path,sql],signal)).trim() || '[]');
  try {
    const [threads,natives,runs,subagents,prs] = await Promise.all([
      query(`SELECT t.thread_id id,t.title,p.workspace_root root,json_extract(t.payload_json,'$.branch') branch,json_extract(t.payload_json,'$.worktreePath') worktree,json_extract(t.payload_json,'$.lineage.parentThreadId') parent,json_extract(t.payload_json,'$.lineage.relationshipToParent') relationship,json_extract(t.payload_json,'$.linkedPullRequest') linkedPullRequest FROM orchestration_v2_projection_threads t JOIN projection_projects p USING(project_id)`),
      query(`SELECT provider_thread_id id,thread_id thread,json_extract(payload_json,'$.nativeThreadRef.nativeId') native,json_extract(payload_json,'$.nativeThreadRef.driver') provider FROM orchestration_v2_projection_provider_threads`),
      query(`SELECT run_id id,thread_id thread,provider_thread_id providerThread,status,requested_at requested,json_extract(payload_json,'$.startedAt') started,completed_at ended FROM orchestration_v2_projection_runs`),
      query(`SELECT subagent_id id,thread_id thread,child_thread_id child,provider_thread_id providerThread,status,started_at started,completed_at ended,json_extract(payload_json,'$.nativeTaskRef.nativeId') native,json_extract(payload_json,'$.title') title FROM orchestration_v2_projection_subagents`),
      query(`SELECT thread_id thread,repository repo,number,linked_at linkedAt FROM projection_thread_pull_requests`)
    ]);
    for (const t of threads) {
      t.linkedPullRequest = typeof t.linkedPullRequest === 'string' ? parse(t.linkedPullRequest) : t.linkedPullRequest;
      const sub = subagents.find(s => s.child === t.id);
      if (sub && !t.parent) { t.parent = sub.thread; t.relationship = 'subagent'; }
    }
    return {threads,natives,runs,subagents,prs,notes:[]};
  } catch { return { threads:[],natives:[],runs:[],subagents:[],prs:[],notes:['t3-metadata-unavailable'] }; }
}

export function inferJob(title = '') {
  const text = title.replaceAll('_','-');
  const role = /\b(build|worker|fix(?:er|ing)?|triage|manager|owner|dispatch|audit|research(?:er)?|review|verifier|hunt(?:er)?|watch|upkeep|scout|council|browser)\b/i.exec(text)?.[1]?.toLowerCase();
  const job = role?.startsWith('hunt') ? 'hunt'
    : role?.startsWith('research') ? 'research' : role?.startsWith('fix') ? 'fix'
    : role ?? (/^Factory · (?:parent )?#\d+/.test(text) ? 'worker' : 'unknown');
  const round = /\b(?:round[\s:-]*|r)(\d+)\b/i.exec(text)?.[1];
  return {job,round:round ? Number(round) || null : null};
}

export function titleItems(title = '') {
  const prs = [...title.matchAll(/\bPR\s*#?\s*(\d+)\b/gi)].map(m => Number(m[1]));
  const factory = /^Factory · (?:parent )?#(\d+)\b/.exec(title);
  // Review, hunt and legacy verifier titles name PRs; Factory titles name issues.
  if (!prs.length && !factory && /^(?:#)(\d+)\b/.test(title) && /^(?:review|hunt|verifier)/.test(inferJob(title).job)) prs.push(Number(/^#(\d+)/.exec(title)[1]));
  return {prs:[...new Set(prs)],issue:factory ? Number(factory[1]) : null};
}

export function mapWork({repo,root,cwds = [],thread,threads = [],prs = [],worktrees = [],items = [],seen = new Set(),at,endedAt}) {
  if (thread && seen.has(thread.id)) return {id:null,reason:'parent-cycle'};
  const next = new Set(seen); if (thread) next.add(thread.id);
  if (OVERHEAD.has(inferJob(thread?.title).job)) return {id:null,reason:'overhead'};
  const direct = prs.filter(p => p.thread === thread?.id && p.repo === repo).map(p => p.number);
  const link = thread?.linkedPullRequest;
  if (link?.repository === repo) direct.unshift(link.number);
  // linkedPullRequest is T3's selected link when a thread has several historical links.
  const historical = prs.filter(p => p.thread === thread?.id && p.repo === repo);
  if (at && new Set(direct).size > 1) {
    // A PR can be created/linked after its implementation's last usage event.
    // One new link within the completed turn owns that work; several do not.
    if ([...new Set(direct)].some(n => !historical.some(p => p.number === n && Number.isFinite(Date.parse(p.linkedAt))))) return {id:null,reason:'multiple-t3-prs-without-time-evidence'};
    const during = historical.filter(p => Date.parse(p.linkedAt) >= Date.parse(at) && Date.parse(p.linkedAt) <= Date.parse(endedAt ?? at));
    const owners = [...new Set(during.map(p => p.number))];
    if (owners.length === 1) return {id:itemId(repo,'pr',owners[0]),reason:'t3-pr-during-turn'};
    if (owners.length > 1) return {id:null,reason:'multiple-t3-prs-during-turn'};
    const dated = historical.filter(p => p.linkedAt && Date.parse(p.linkedAt) <= Date.parse(at)).sort((a,b) => Date.parse(b.linkedAt)-Date.parse(a.linkedAt));
    if (dated[0] && (!dated[1] || dated[0].linkedAt !== dated[1].linkedAt)) return {id:itemId(repo,'pr',dated[0].number),reason:'t3-pr-at-time'};
    return {id:null,reason:'multiple-t3-prs-without-time-evidence'};
  }
  if (link?.repository === repo) return {id:itemId(repo,'pr',link.number),reason:'t3-pr'};
  const unique = [...new Set(direct)];
  if (unique.length === 1) return {id:itemId(repo,'pr',unique[0]),reason:'t3-pr'};
  if (unique.length > 1) return {id:null,reason:'multiple-t3-prs'};
  const fromBranch = branch => {
    const matches = [...new Map(items.filter(i => i.kind === 'pr' && i.branch === branch).map(i => [i.id,i])).values()];
    if (matches.length === 1) return {id:matches[0].id,reason:'branch-pr'};
    if (matches.length > 1) return {id:null,reason:'reused-branch'};
    const n = Number(/^[^/]+\/(\d+)-/.exec(branch)?.[1]);
    const issue = items.find(i => i.kind === 'issue' && i.number === n);
    return issue ? {id:issue.id,reason:'branch-issue'} : null;
  };
  if (thread?.branch && !['main','master'].includes(thread.branch)) {
    const mapping = fromBranch(thread.branch); if (mapping) return mapping;
  }
  const titled = titleItems(thread?.title);
  if (titled.prs.length === 1) return {id:itemId(repo,'pr',titled.prs[0]),reason:'title-pr'};
  if (titled.prs.length > 1) return {id:null,reason:'multiple-title-prs'};
  if (titled.issue) {
    const matches = [...new Map(items.filter(i => i.kind === 'pr' && Number(/^[^/]+\/(\d+)-/.exec(i.branch ?? '')?.[1]) === titled.issue).map(i => [i.id,i])).values()];
    if (matches.length === 1) return {id:matches[0].id,reason:'factory-title-pr'};
    return {id:itemId(repo,'issue',titled.issue),reason:'factory-title-issue'};
  }
  if (thread?.relationship === 'subagent' && thread.parent) {
    const parent = threads.find(t => t.id === thread.parent && (!root || t.root === thread.root));
    if (parent) {
      const mapping = mapWork({repo,root,thread:parent,threads,prs,items,seen:next,at,endedAt});
      if (mapping.id || mapping.reason === 'parent-cycle') return {...mapping,reason:`parent-${mapping.reason}`};
    }
  }
  const branches = new Set();
  for (const cwd of cwds) {
    const matches = worktrees.filter(w => w.path !== root && inside(cwd,w.path)).sort((a,b) => b.path.length-a.path.length);
    if (matches[0]?.branch && !['main','master'].includes(matches[0].branch)) branches.add(matches[0].branch);
    const names = [...new Set(threads.filter(t => t.worktree && inside(cwd,t.worktree)).map(t => t.branch).filter(Boolean))];
    if (names.length === 1 && !['main','master'].includes(names[0])) branches.add(names[0]);
  }
  if (branches.size !== 1) return {id:null,reason:branches.size ? 'multiple-branches' : 'shared-or-unknown-cwd'};
  return fromBranch([...branches][0]) ?? {id:null,reason:'branch-has-no-item'};
}

export function mechanicalItem(repo, item, detail, events = [], comments = []) {
  const labels = (item.labels ?? []).map(l => typeof l === 'string' ? l : l.name);
  const ordered = [...events].sort((a,b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
  const added = ordered.filter(e => e.event === 'labeled');
  const source = /\bsource:\s*([\w-]+)/i.exec(item.body ?? '')?.[1]
    ?? added.find(e => e.label?.name?.startsWith('source:'))?.label.name.slice(7)
    ?? labels.find(l => l.startsWith('source:'))?.slice(7) ?? 'unknown';
  let fixing = false, review_rounds = 0;
  for (const e of added) {
    if (e.label?.name === 'fixing') fixing = true;
    if (e.label?.name === 'reviewer-ready' && fixing) { review_rounds++; fixing = false; }
  }
  const pings = name => added.filter(e => e.label?.name === `needs-${name}`).length + comments.filter(c => {
    const text = c.body ?? '';
    // Only requests, not quotes of decisions or the skill's incidental wording.
    return new RegExp(`(?:^|\\n)\\s*(?:needs-${name}\\b|@${name}\\b|${name} request:)`,'i').test(text);
  }).length;
  const kind = item.pull_request ? 'pr' : 'issue';
  let outcome = item.state === 'open' ? 'open' : kind === 'pr' && detail?.merged_at ? 'merged' : item.state_reason === 'not_planned' ? 'not_planned' : 'closed';
  if (outcome !== 'open') {
    if (labels.includes('reverted')) outcome = 'reverted';
    else if (labels.includes('superseded')) outcome = 'superseded';
    else if (labels.includes('duplicate') || ordered.some(e => e.event === 'marked_as_duplicate')) outcome = 'duplicate';
  }
  return {id:itemId(repo,kind,item.number),project_id:repo,kind,number:item.number,title:item.title,
    source,priority:labels.find(l => /^p[0-3]$/i.test(l))?.toUpperCase() ?? null,
    opened_at:item.created_at,done_at:item.state === 'open' ? null : detail?.merged_at ?? item.closed_at,
    outcome,lines_changed:kind === 'pr' ? (detail.additions ?? 0)+(detail.deletions ?? 0) : null,
    review_rounds,pings_human:pings('human'),pings_owner:pings('owner'),pings_manager:pings('manager')};
}

async function github(repo, since, signal, numbers = [], branches = []) {
  const api = async path => JSON.parse(await command('gh',['api',path],signal));
  const pages = async path => {
    const rows = [];
    for (let page=1;;page++) {
      const chunk = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      if (!Array.isArray(chunk)) throw safeError('github-invalid-page');
      rows.push(...chunk);
      if (chunk.length < 100) return rows;
    }
  };
  const touched = await pages(`repos/${repo}/issues?state=all&sort=updated&direction=asc&since=${encodeURIComponent(since)}`);
  // A worker's PR may predate the update window and have no explicit T3 link.
  for (const branch of new Set(branches)) {
    const heads = await pages(`repos/${repo}/pulls?state=all&head=${encodeURIComponent(`${repo.split('/')[0]}:${branch}`)}`);
    numbers.push(...heads.map(p => p.number));
  }
  for (const number of new Set(numbers)) if (!touched.some(i => i.number === number)) touched.push(await api(`repos/${repo}/issues/${number}`));
  const facts = [], links = [], branchItems = [];
  // Small concurrent groups keep the wake bounded without flooding GitHub.
  for (let at=0;at<touched.length;at+=4) {
    await Promise.all(touched.slice(at,at+4).map(async item => {
      const [detail,events,comments] = await Promise.all([
        item.pull_request ? api(`repos/${repo}/pulls/${item.number}`) : Promise.resolve(null),
        pages(`repos/${repo}/issues/${item.number}/timeline`),pages(`repos/${repo}/issues/${item.number}/comments`)
      ]);
      const fact = mechanicalItem(repo,item,detail,events,comments);
      facts.push(fact); branchItems.push({...fact,branch:detail?.head?.ref});
      if (detail) {
        for (const m of (detail.body ?? '').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+(?:https:\/\/github\.com\/([^/]+\/[^/]+)\/issues\/|([\w.-]+\/[\w.-]+)#|#)(\d+)\b/gi)) {
          if ((!m[1] || m[1] === repo) && (!m[2] || m[2] === repo)) links.push({issue:itemId(repo,'issue',Number(m[3])),pr:fact.id,number:Number(m[3])});
        }
      }
    }));
  }
  // Closing references can predate the incremental window.
  for (const n of new Set(links.map(l => l.number))) if (!facts.some(f => f.kind === 'issue' && f.number === n)) {
    const item = await api(`repos/${repo}/issues/${n}`);
    if (item.pull_request) continue;
    const [events,comments] = await Promise.all([pages(`repos/${repo}/issues/${n}/timeline`),pages(`repos/${repo}/issues/${n}/comments`)]);
    facts.push(mechanicalItem(repo,item,null,events,comments));
  }
  return {facts,links,branchItems};
}

export async function collectCharges({home,since,signal,endedNativeIds = []}) {
  // This project vendors metrics source only; stop before local access or external writes.
  throw safeError('project-metrics-disabled');
  const [claude,codex] = await Promise.all([recentLogs(join(home,'.claude/projects'),since),recentLogs(join(home,'.codex/sessions'),since)]);
  // Continuations may only carry the later cumulative total. Include older
  // files of a recently modified native session to recover the baseline.
  const ids = new Set([...endedNativeIds,...codex.map(f => /([\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})\.jsonl$/i.exec(f)?.[1])].filter(Boolean));
  if (ids.size) for (const file of await recentLogs(join(home,'.codex/sessions'),0)) {
    const id = /([\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})\.jsonl$/i.exec(file)?.[1];
    if (ids.has(id) && !codex.includes(file)) codex.push(file);
  }
  if (endedNativeIds.length) for (const file of await recentLogs(join(home,'.claude/projects'),0)) {
    if (endedNativeIds.includes(basename(file,'.jsonl')) || endedNativeIds.includes(basename(file,'.jsonl').replace(/^agent-/,'')) && !claude.includes(file)) claude.push(file);
  }
  const ctx = {start:0,end:Infinity,belongs:() => true,details:true};
  // Parse whole candidate sessions to replace totals. Never add deltas to D1.
  const charges = await claudeCharges(claude,ctx);
  if (signal?.aborted) throw safeError('sync-timeout');
  charges.push(...await codexCharges(codex,ctx));
  // Claude subagent sessions use parent sessionId; never attach the parent's
  // T3 run to them. Codex native sessions have their own stable id.
  return charges;
}

export function buildRuns({charges,t3,root,home,repo,worktrees,items,now = new Date(),prices = loadPrices(),priorRuns = []}) {
  const canon = canonicalizer();
  const belongs = projectMatcher(root,home,canon);
  const rootPaths = worktrees.map(w => canon(w.path));
  const threads = t3.threads;
  const byThread = new Map(threads.map(t => [t.id,t]));
  const otherRoots = [...new Set(threads.map(t => t.root).filter(r => r && canon(r) !== canon(root)))];
  const otherProjectMatchers = otherRoots.map(r => projectMatcher(r,home,canon));
  const groups = new Map();
  let active = 0;
  const latestUsage = new Map();
  for (const c of charges) latestUsage.set(`${c.session}:${chargeTurn(c)}`, Math.max(latestUsage.get(`${c.session}:${chargeTurn(c)}`) ?? 0, Date.parse(c.at)));
  for (const c of charges) {
    const provider = c.codex ? 'codex' : 'claude';
    const nativeId = c.session.slice(provider.length+1);
    const native = t3.natives.find(n => n.native === nativeId && (n.provider === provider || (provider === 'claude' && n.provider === 'claudeAgent')));
    const sub = t3.subagents.find(s => s.native === nativeId || s.native?.endsWith(`:${nativeId}`) || (provider === 'claude' && nativeId.includes(':agent:') && s.native === nativeId.split(':agent:')[1].replace(/^agent-/,'')));
    const thread = byThread.get(native?.thread ?? sub?.child ?? sub?.thread);
    const runs = native ? t3.runs.filter(r => r.providerThread === native.id).sort((a,b) => Date.parse(a.started ?? a.requested)-Date.parse(b.started ?? b.requested)) : [];
    const at = Date.parse(c.at);
    const run = runs.filter(r => at >= Date.parse(r.started ?? r.requested) && (!r.ended || at <= Date.parse(r.ended))).at(-1) ?? (runs.length === 1 && !runs[0].started && !runs[0].requested ? runs[0] : null);
    const actual = c.nativeRun ?? sub ?? run;
    // Explicit project cwd wins over an inherited T3 project. T3 can recover
    // shared scratch ownership only when cwd doesn't name another project.
    const nativeProject = thread?.root && canon(thread.root) === canon(root);
    const cwdProject = belongs(c.cwd) || rootPaths.some(p => typeof c.cwd === 'string' && inside(canon(c.cwd),p));
    if (!cwdProject && (!nativeProject || otherProjectMatchers.some(matches => matches(c.cwd)))) continue;
    if (actual && (ACTIVE.has(actual.status) || !actual.ended)) { active++; continue; }
    if (!actual && latestUsage.get(`${c.session}:${chargeTurn(c)}`) > now.getTime()-30*60*1000) { active++; continue; }
    const turnKey = c.claude && !c.turn && actual?.id ? `t3-${actual.id}` : chargeTurn(c);
    const source_key = `${c.session}:${turnKey}:${repo}:${c.model}`;
    let g = groups.get(source_key);
    if (!g) { g = {source_key,charges:[],cwds:new Set(),obsoleteKeys:new Set(),thread:nativeProject ? thread : null,t3Thread:thread?.id,actual,title:sub?.title ?? thread?.title ?? ''}; groups.set(source_key,g); }
    if (c.claude) {
      g.obsoleteKeys.add(`${c.session}:session:${repo}:${c.model}`);
      if (!c.turn && actual?.id) g.obsoleteKeys.add(`${c.session}:day-${localDay(c.at)}:${repo}:${c.model}`);
      // Whole candidate logs are parsed. Retire both fallback representations
      // of this session/model, including T3 keys when metadata disappears.
      const prefix = `${c.session}:`, suffix = `:${repo}:${c.model}`;
      for (const old of g.charges.length ? [] : priorRuns) {
        if (!old.source_key.startsWith(prefix) || !old.source_key.endsWith(suffix)) continue;
        const turn = old.source_key.slice(prefix.length,-suffix.length);
        if (turn === 'session' || turn.startsWith('day-') || turn.startsWith('t3-')) g.obsoleteKeys.add(old.source_key);
      }
    }
    g.charges.push(c); if (typeof c.cwd === 'string') g.cwds.add(canon(c.cwd));
  }
  const rows = [];
  for (const g of groups.values()) {
    const times = g.charges.map(c => c.at).sort();
    const startedAt = g.actual?.started ?? g.actual?.requested ?? times[0];
    const endedAt = g.actual?.ended ?? times.at(-1);
    const mapping = mapWork({repo,root:canon(root),cwds:[...g.cwds],thread:g.thread,threads,prs:t3.prs,worktrees,items,at:startedAt,endedAt});
    const cost = summarize(g.charges,prices);
    const days = new Map();
    for (const c of g.charges) {
      const day = localDay(c.at);
      const list = days.get(day) ?? []; list.push(c); days.set(day,list);
    }
    const outcome = {completed:'done',failed:'failed',interrupted:'interrupted',cancelled:'interrupted',rolled_back:'failed'}[g.actual?.status] ?? 'unknown';
    const row = {id:g.source_key,project_id:repo,work_item_id:mapping.id,t3_thread_id:g.t3Thread ?? null,
      ...inferJob(g.title),provider:g.charges[0].codex ? 'codex' : 'claude',model:g.charges[0].model,
      started_at:startedAt,ended_at:endedAt,outcome,
      cost_usd:cost.usd,estimated:1,source_key:g.source_key,attribution:mapping.reason,
      pricing_note:cost.unpriced.length ? 'unknown model: conservative list-price fallback' : 'API list-price equivalent; flat-fee plan, not an invoice'};
    rows.push({row,obsoleteKeys:[...g.obsoleteKeys],days:[...days].map(([local_day,list]) => ({local_day,cost_usd:summarize(list,prices).usd})),cwds:[...g.cwds]});
  }
  const obsolete = new Set(rows.flatMap(r => r.obsoleteKeys));
  assignRounds(rows.map(r => r.row),priorRuns.filter(r => !obsolete.has(r.source_key)));
  return {rows,active};
}

// Count attempts, not model rows, and include already imported earlier attempts.
export function assignRounds(rows, priorRuns = []) {
  const all = [...new Map([...priorRuns,...rows].map(r => [r.source_key,r])).values()];
  const attempt = r => r.source_key.slice(0,r.source_key.lastIndexOf(`:${r.project_id}:`));
  const workers = all.filter(r => r.work_item_id && ['build','worker','fix'].includes(r.job));
  for (const r of rows) {
    if (!r.work_item_id) continue;
    const earlier = new Set(workers.filter(w => w.work_item_id === r.work_item_id && w.started_at < r.started_at && attempt(w) !== attempt(r)).map(attempt)).size;
    if (['build','worker','fix'].includes(r.job)) r.round = earlier+1;
    else if (r.round === null && /^(?:review|hunt)/.test(r.job)) r.round = Math.max(1,earlier);
  }
}

// Use the logged-in Wrangler OAuth token in memory. Wrangler handles refresh;
// the writer never implements a second credential store or installs anything.
export async function d1Client({config,home,signal,fetcher = fetch,refresh}) {
  // This project vendors metrics source only; stop before local access or external writes.
  throw safeError('project-metrics-disabled');
  const authFile = join(home,'Library/Preferences/.wrangler/config/default.toml');
  const readAuth = () => {
    let text; try { text = readFileSync(authFile,'utf8'); } catch { throw safeError('wrangler-login-required'); }
    const token = /^oauth_token\s*=\s*"([^"]+)"/m.exec(text)?.[1];
    const expiry = /^expiration_time\s*=\s*"([^"]+)"/m.exec(text)?.[1];
    if (!token) throw safeError('wrangler-login-required');
    return {token,expiry};
  };
  const refreshAuth = refresh ?? (async () => {
    const installed = process.env.FACTORY_METRICS_WRANGLER ?? join(home,'control-center/node_modules/wrangler/bin/wrangler.js');
    if (existsSync(installed)) await command(process.execPath,[installed,'whoami'],signal);
    else await command('npx',['--no-install','wrangler','whoami'],signal);
  });
  let auth = readAuth();
  if (Date.parse(auth.expiry) <= Date.now()+60000) { await refreshAuth(); auth = readAuth(); }
  const db = config.d1_databases[0].database_id;
  const request = async data => {
    for (let attempt=0;attempt<2;attempt++) {
      let response, body;
      try {
        response = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${config.account_id}/d1/database/${db}/query`,{
          method:'POST',headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},
          body:JSON.stringify(data),signal:signal ?? AbortSignal.timeout(15000)
        });
        body = await response.json();
      } catch { throw safeError('d1-network-or-timeout'); }
      if (response.status === 401 || response.status === 403) {
        if (attempt === 0) { await refreshAuth(); auth = readAuth(); continue; }
        throw safeError('wrangler-login-or-d1-permission-required');
      }
      if (!response.ok || !body.success || !Array.isArray(body.result) || body.result.some(r => !r.success)) throw safeError('d1-query-failed');
      return body.result.flatMap(r => r.results ?? []);
    }
  };
  const query = (sql,params = []) => request({sql,params});
  query.batch = batch => request({batch});
  return query;
}

export async function sync({repo,root,home = homedir(),signal,query,now = new Date(),since,t3,charges,githubReader = github}) {
  // This project vendors metrics source only; stop before local access or external writes.
  throw safeError('project-metrics-disabled');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '') || !root) throw safeError('repo-and-root-required');
  const config = parse(readFileSync(configPath,'utf8'));
  query ??= await d1Client({config,home,signal});
  const through = now.toISOString();
  let factory = {};
  try { factory = parse(readFileSync(join(root,'factory.json'),'utf8')) ?? {}; } catch { /* metadata optional */ }
  const project = {id:repo,name:repo.split('/')[1],repo,dark:factory.owner === 'agent' ? 1 : 0,budget_usd:factory.budgetUsd ?? null,timezone:'Asia/Ulaanbaatar'};
  const pq = upsert('projects',project); await query(pq.sql,pq.params);
  const state = (await query('SELECT github_through,logs_through FROM sync_state WHERE project_id=?',[repo]))[0] ?? {};
  const localDate = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ulaanbaatar',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const first = since ?? new Date(`${localDate}T00:00:00+08:00`).toISOString();
  if (!Number.isFinite(Date.parse(first))) throw safeError('invalid-since');
  const ghSince = new Date(Date.parse(since ?? state.github_through ?? first)-1000).toISOString();
  const logSince = Date.parse(since ?? state.logs_through ?? first)-3600000;
  const metadata = t3 ?? await readT3(home,signal);
  const endedProviderThreads = new Set(metadata.runs.filter(r => r.ended && Date.parse(r.ended) >= logSince).map(r => r.providerThread));
  const endedNativeIds = metadata.natives.filter(n => endedProviderThreads.has(n.id)).map(n => n.native).filter(Boolean);
  for (const sub of metadata.subagents) if (sub.ended && Date.parse(sub.ended) >= logSince && sub.native) endedNativeIds.push(sub.native.split(':').at(-1));
  const cachedItems = await query('SELECT id,kind,number FROM work_items WHERE project_id=?',[repo]);
  const relevantThreads = metadata.threads.filter(t => t.root === root);
  const titleNumbers = relevantThreads.flatMap(t => {const named=titleItems(t.title);return [...named.prs,...(named.issue ? [named.issue] : [])];});
  const linked = metadata.prs.filter(p => p.repo === repo && !cachedItems.some(w => w.kind === 'pr' && w.number === p.number)).map(p => p.number);
  linked.push(...titleNumbers.filter(n => !cachedItems.some(w => w.number === n)));
  linked.push(...relevantThreads.map(t => t.linkedPullRequest).filter(p => p?.repository === repo && !cachedItems.some(w => w.kind === 'pr' && w.number === p.number)).map(p => p.number));
  const cachedBranches = await query('SELECT branch FROM branch_items WHERE project_id=?',[repo]);
  const unknownBranches = [...new Set(relevantThreads.map(t => t.branch).filter(b => b && !['main','master'].includes(b) && !cachedBranches.some(c => c.branch === b)))];
  const [logCharges,treeText,gh] = await Promise.all([
    charges ?? collectCharges({home,since:logSince,signal,endedNativeIds}),
    command('git',['-C',root,'worktree','list','--porcelain'],signal),githubReader(repo,ghSince,signal,linked,unknownBranches)
  ]);
  const canon = canonicalizer();
  const worktrees = treeText.split('\n\n').map(block => ({path:/^worktree (.+)$/m.exec(block)?.[1],branch:/^branch refs\/heads\/(.+)$/m.exec(block)?.[1]})).filter(w => w.path).map(w => ({...w,path:canon(w.path)}));
  await persist(query,gh.facts.map(fact => upsert('work_items',fact)));
  // Refresh even an empty body, and keep each PR's delete + inserts in one
  // transaction rather than allowing the ordinary 40-statement chunking.
  for (const pr of gh.facts.filter(f => f.kind === 'pr')) {
    await atomic(query,[{sql:'DELETE FROM work_item_links WHERE pr_id=?',params:[pr.id]},
      ...gh.links.filter(link => link.pr === pr.id).map(link => ({sql:'INSERT OR IGNORE INTO work_item_links(issue_id,pr_id) SELECT ?,? WHERE EXISTS(SELECT 1 FROM work_items WHERE id=?) AND EXISTS(SELECT 1 FROM work_items WHERE id=?)',params:[link.issue,link.pr,link.issue,link.pr]}))]);
  }
  const known = await query('SELECT id,kind,number FROM work_items WHERE project_id=?',[repo]);
  const branchRows = await query('SELECT branch,work_item_id FROM branch_items WHERE project_id=?',[repo]);
  await persist(query,gh.branchItems.filter(i => i.branch).map(item => ({sql:'INSERT INTO branch_items(project_id,branch,work_item_id) VALUES(?,?,?) ON CONFLICT(project_id,branch,work_item_id) DO NOTHING',params:[repo,item.branch,item.id]})));
  const items = known.map(i => ({...i,branch:gh.branchItems.find(b => b.id === i.id)?.branch}));
  for (const b of branchRows) { const item = known.find(i => i.id === b.work_item_id); if (item) items.push({...item,branch:b.branch}); }
  // De-duplicate cached and newly touched branches.
  const uniqueItems = [...new Map(items.map(i => [`${i.id}:${i.branch}`,i])).values()];
  const priorRuns = await query('SELECT source_key,project_id,work_item_id,job,started_at FROM agent_runs WHERE project_id=?',[repo]);
  const built = buildRuns({priorRuns,charges:logCharges,t3:metadata,root,home,repo,worktrees,items:uniqueItems,now});
  const reasons = {};
  const writes = [];
  for (const {row,days} of built.rows) {
    // Reject dangling evidence (for example a link to an inaccessible item).
    if (row.work_item_id && !known.some(w => w.id === row.work_item_id)) { row.work_item_id = null; row.attribution = 'linked-item-not-synced'; }
    writes.push(upsert('agent_runs',row));
    for (const day of days) writes.push({sql:'INSERT INTO run_days(run_id,project_id,local_day,cost_usd) VALUES(?,?,?,?) ON CONFLICT(run_id,local_day) DO UPDATE SET cost_usd=excluded.cost_usd',params:[row.id,repo,day.local_day,day.cost_usd]});
    if (!row.work_item_id) reasons[row.attribution] = (reasons[row.attribution] ?? 0)+1;
  }
  // Retire cumulative and alternate fallback rows before replacements, so a
  // partial write cannot leave the same usage charged under both key forms.
  const currentKeys = new Set(built.rows.map(r => r.row.source_key));
  const legacy = new Set(built.rows.flatMap(r => r.obsoleteKeys).filter(key => !currentKeys.has(key)));
  const deletes = [...legacy].flatMap(key => [
    {sql:'DELETE FROM run_days WHERE run_id=?',params:[key]},
    {sql:'DELETE FROM agent_runs WHERE source_key=?',params:[key]}
  ]);
  await persist(query,deletes);
  await persist(query,writes);
  // Checkpoints advance only after both sources were fully persisted. A
  // partial failure leaves replaceable rows and retries the same window.
  await query('INSERT INTO sync_state(project_id,github_through,logs_through) VALUES(?,?,?) ON CONFLICT(project_id) DO UPDATE SET github_through=max(sync_state.github_through,excluded.github_through),logs_through=max(sync_state.logs_through,excluded.logs_through)',[repo,through,through]);
  return {job:'metrics',runs:built.rows.length,work_items:gh.facts.length,unattributed:Object.values(reasons).reduce((a,b) => a+b,0),reasons,notes:metadata.notes};
}

export async function neverBlock(work,timeoutMs = 55000) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([Promise.resolve().then(() => work(controller.signal)),new Promise((_,reject) => {
      timer = setTimeout(() => {controller.abort(); reject(safeError('sync-timeout'));},timeoutMs);
    })]);
  } catch (e) { return {job:'metrics',notes:[`metrics deferred: ${e.metricsCode ?? 'sync-failed'}; dispatch continues`]}; }
  finally {clearTimeout(timer);}
}
async function main() {
  const args = process.argv.slice(2);
  const opt = name => {const i=args.indexOf(`--${name}`); return i < 0 ? undefined : args[i+1];};
  const result = await neverBlock(signal => sync({repo:opt('repo'),root:opt('root') && resolve(opt('root')),since:opt('since'),signal}));
  console.log(JSON.stringify(result));
  // Abort has already reached child processes and HTTP calls. Ensure a
  // delayed parser or transport can't keep the dispatcher waiting afterward.
  process.exit(0);
}
let entry; try {entry=process.argv[1] && realpathSync(process.argv[1]);} catch {}
if (entry === realpathSync(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify({ job: 'metrics', notes: ['project-metrics-disabled; use the estimated daily ledger'] }));
  process.exitCode = 1;
}
