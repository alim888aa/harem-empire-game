#!/usr/bin/env node
// Decides what a project's dispatch thread does next. It reads GitHub and git,
// takes the T3 thread list on stdin, and prints a plan as JSON. With --apply it
// also makes the GitHub and git changes itself, so all that's left for the
// agent are the T3 calls (launch, resume, settle, triage, research, tell the
// manager). With `budgetUsd` in factory.json it counts today's spend first
// (usage.mjs) and starts only p0 work once it's reached.
//
//   node dispatch-plan.mjs --repo owner/name [--finished 102] [--tick] [--apply] < threads.json
//   node dispatch-plan.mjs --ack 9:parent-run,research@2026-10-11
//   node dispatch-plan.mjs --settle-result <threadId> < result.json
//
// --config <file> reads factory.json from a local file instead of the default
// branch, for trying it on a project that isn't set up yet. --ack records
// parent-run and research notifications. Manager labels are checked every tick.
//
// Run it from the project's main checkout. The decisions live in plan(), which
// is pure so they can be tested against made-up label states.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { assessActivation } from "../../../scripts/factory/activation.mjs";

export const ISSUE_STATUSES = ["needs-human", "needs-manager", "blocked", "backlog", "agent-ready", "building"];
export const PR_STATUSES = ["reviewer-ready", "fixing", "blocked", "approved", "human-ready", "needs-human", "needs-manager"];
const isCleanup = (a) => ["remove-worktree", "delete-local-branch", "delete-branch"].includes(a.do);
const cleanupIssues = (actions, applied = false) => [...new Set(actions.filter((a) => isCleanup(a) && (!applied || (a.ok === true && a.changed === true))).map((a) => a.issue))];
const LOOP = ["reviewer-ready", "fixing"];
const MANAGER_LABELS = ["needs-manager", "needs-human", "human-ready", "human-comment", "approved"];
const ACTIVE = ["preparing", "queued", "starting", "running", "waiting"];
const HOUR = 60 * 60 * 1000;
const TRIAGE_INTERVAL = 30 * 60 * 1000;
export const SETTLE_ATTEMPTS = 3;
const LIST_LIMIT = 1000;

const isStatus = (label) => ISSUE_STATUSES.includes(label) || PR_STATUSES.includes(label) || label === "verifier-ready" || label.startsWith("deployed:");
const statusOf = (item) => {
  const statuses = item.labels.filter(isStatus);
  // Migration fallback for repos still labelled verifier-ready.
  return statuses.length === 1 ? (statuses[0] === "verifier-ready" ? "reviewer-ready" : statuses[0]) : null;
};
const statusWrite = (item, status) => ({
  do: "label", issue: item.number, number: item.number,
  expectedStatuses: item.labels.filter(isStatus),
  labels: [...item.labels.filter((l) => !isStatus(l)), status],
});
const commentAction = (number, body) => ({ do: "comment", issue: number, number, body: `Author: dispatch\n\n${body}` });
const statusConflict = (item) => {
  const statuses = item.labels.filter(isStatus);
  const reason = `Can't classify #${item.number}: multiple status labels (${statuses.join(", ")}); started nothing. Manager must decide the status.`;
  return { reason, github: [commentAction(item.number, reason), statusWrite(item, "needs-manager")] };
};
const priority = (item) => {
  const p = item.labels.find((l) => /^p[0-3]$/.test(l));
  return p ? Number(p[1]) : 2;
};

export function links(text, word) {
  const re = new RegExp(`^\\s*(?:[-*]\\s*)?${word} #(\\d+)\\s*$`, "gim");
  return [...(text ?? "").matchAll(re)].map((m) => Number(m[1]));
}

// Base records a branch plus optional inspection evidence, not a pinned SHA.
function explicitBase(body) {
  const lines = [...(body ?? "").matchAll(/^[\t ]*Base:[\t ]*(.*)$/gim)];
  if (!lines.length) return {};
  const branches = [];
  for (const [, value] of lines) {
    const match = /^(?:`([^`]+)`|([^\s`]+))(?:\s+.*)?$/.exec(value.trim());
    const branch = (match?.[1] ?? match?.[2] ?? "").trim();
    // git check-ref-format --branch rules, kept pure for plan().
    if (!branch || branch === "HEAD" || branch.startsWith("-") ||
        /[\x00-\x20\x7f~^:?*\[\\]/.test(branch) || branch.includes("..") || branch.includes("@{") ||
        branch.split("/").some((part) => !part || part.startsWith(".") || part.endsWith(".lock")) || branch.endsWith(".")) {
      return { error: "malformed `Base:` line; name one valid branch before any inspection text" };
    }
    branches.push(branch);
  }
  if (new Set(branches).size > 1) return { error: "conflicting `Base:` lines name different branches" };
  return { branch: branches[0] };
}

// Resolve explicit and inherited bases identically during planning and apply.
function explicitIssueBase(i, { refs, defaultBranch = "main", remoteBranches }) {
  let { branch, error: malformed } = explicitBase(i.body);
  const p = links(i.body, "Part of")[0];
  const feature = p ? refs[p]?.featureBranch : null;
  let error = malformed;
  if (branch && p && !feature) error = `plan #${p} has no \`Feature branch:\` line to compare with \`Base: ${branch}\``;
  else {
    // Older child bodies recorded the inspected default branch. Their plan
    // still owns the build base, so validate it before ignoring that evidence.
    if (p && branch === defaultBranch) branch = null;
    if (branch && p && branch !== feature) error = `\`Base: ${branch}\` conflicts with plan #${p}'s feature branch \`${feature}\``;
    else if (branch && !remoteBranches.includes(branch) && !(p && branch === feature)) error = `\`Base: ${branch}\` names a branch that does not exist on origin`;
  }
  return { branch, error };
}

function baseFor(i, state) {
  const explicit = i.labels.includes("type:plan") ? {} : explicitIssueBase(i, state);
  if (!explicit.error && explicit.branch) return explicit.branch;
  const p = links(i.body, "Part of")[0];
  return p ? state.refs[p]?.featureBranch ?? null : state.defaultBranch ?? "main";
}

const namedBases = (i) => [...(i.body ?? "").matchAll(/^[\t ]*Base:[\t ]*(.*)$/gim)]
  .map((m) => explicitBase(`Base: ${m[1]}`).branch).filter(Boolean);

function refFromIssue(r) {
  const fb = /^\s*Feature branch:\s*`?([^\s`]+)`?\s*$/im.exec(r.body ?? "");
  let reason = "COMPLETED";
  // A closed PR counts as done only if it merged; a closed issue unless it
  // was closed as not planned or as a duplicate.
  if (r.pull_request) reason = r.pull_request.merged_at ? "COMPLETED" : "NOT_PLANNED";
  else if (r.state_reason === "not_planned" || r.state_reason === "duplicate") reason = "NOT_PLANNED";
  return { closed: r.state === "closed", reason, featureBranch: fb?.[1] ?? null };
}

const protectedFeatureBranches = (refs) => new Set(Object.values(refs)
  .filter((r) => !r.closed || r.reason !== "COMPLETED").map((r) => r.featureBranch).filter(Boolean));

// Bodies carry the contract's links; comments also carry worker stop reports.
// Neither source may hide a blocker still named by the other.
export function blockerLinks(body, comments) {
  const latest = [...comments].reverse().find((c) => links(c.body, "Blocked by").length);
  return [...new Set([...links(body, "Blocked by"), ...links(latest?.body, "Blocked by")])];
}

export function slug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 6)
    .join("-")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export function modelSelection(config, job) {
  const defaults = {
    review: { provider: "claudeAgent", model: "claude-opus-5-5", effort: "high" },
    hunt: { provider: "codex", model: "gpt-6.1-sol", effort: "high" },
  };
  // Old factory.json files configured review under review-*.
  const legacy = job === "review" ? config.jobs?.["review-*"] : null;
  const j = config.jobs?.[job] ?? legacy ?? defaults[job];
  if (!j) throw new Error(`factory.json has no model for ${job}`);
  const key = j.provider === "claudeAgent" ? "effort" : "reasoningEffort";
  return { instanceId: j.provider, model: j.model, options: j.effort ? { [key]: j.effort } : {} };
}

// state: everything gathered from GitHub, git and T3. Returns the actions,
// GitHub/git ones in the order they must happen, then the T3 ones. Every
// action carries the issue it's for, so a failed GitHub step can hold back
// the T3 steps that depend on it.
export function plan(state, { finished = null, tick = false } = {}) {
  const { config, issues, prs, closedPrs, refs, threads, root } = state;
  const defaultBranch = state.defaultBranch ?? "main";
  const dark = config.owner === "agent";
  let worktrees = state.worktrees;
  let remoteBranches = state.remoteBranches;
  let localBranches = state.localBranches ?? [];
  const github = [];
  const t3 = [];
  const notes = [];
  const repoName = basename(root);

  // Threads and slots. Worker threads are `Factory · #<issue>` and
  // `Factory · parent #<plan>`; one holds a slot while it or anything under
  // it (subagents, their subagents) is active.
  const active = (t) => ACTIVE.includes(t.status);
  const byId = new Map(threads.map((t) => [t.threadId, t]));
  const rootOf = (t) => {
    let cur = t;
    for (let i = 0; i < 20 && cur?.parentThreadId && byId.has(cur.parentThreadId); i++) cur = byId.get(cur.parentThreadId);
    return cur;
  };
  const issueOf = (t) => {
    const m = /^Factory · #(\d+)$/.exec(t.title ?? "");
    return m && !t.parentThreadId ? Number(m[1]) : null;
  };
  const isWorker = (t) => !t.parentThreadId && /^Factory · (parent )?#\d+$/.test(t.title ?? "");
  const busyRoots = new Set(threads.filter(active).map((t) => rootOf(t).threadId));
  const slotFreeIssues = new Set(prs.filter((p) => ["approved", "human-ready"].includes(statusOf(p))).flatMap((p) => links(p.body, "Closes")));
  const holds = (t) => busyRoots.has(t.threadId) && !slotFreeIssues.has(issueOf(t)) && !(finished != null && issueOf(t) === finished);
  const workers = threads.filter(isWorker);
  // Busy work whose chain we can't follow up to a known thread might belong
  // to a worker, so it takes a slot until it's done.
  const unresolved = [...busyRoots].filter((id) => byId.get(id)?.parentThreadId);
  // Its owner could be any worker, so while it runs nothing gets cleaned up
  // or resumed; new issues still start into the slots left.
  if (unresolved.length) notes.push(`${unresolved.length} busy thread(s) with an unknown parent: slots taken, no cleanup or resume this wake`);
  const slotsUsed = workers.filter(holds).length + unresolved.length;
  const subtreeBusy = (t, includeBlocked = false) => active(t) || (includeBlocked && t.status === "blocked") || threads.some((c) => c.parentThreadId === t.threadId && subtreeBusy(c, includeBlocked));
  const holding = new Set(workers.filter(holds).map(issueOf).filter((n) => n != null));
  // The newest unsettled thread per issue; the list comes newest first.
  const threadFor = new Map();
  for (const t of workers) {
    const n = issueOf(t);
    if (n != null && !t.settled && !threadFor.has(n)) threadFor.set(n, t);
  }
  // Settled workers still own cleanup, but must not be resumed.
  const cleanupThreads = new Map(threadFor);
  for (const t of workers) {
    const n = issueOf(t);
    if (n != null && !cleanupThreads.has(n)) cleanupThreads.set(n, t);
  }

  const openIssue = new Map(issues.map((i) => [i.number, i]));
  const openPrsFor = (n) => prs.filter((p) => links(p.body, "Closes").includes(n));
  const featureBranches = protectedFeatureBranches(refs);
  const closedHeads = new Set(closedPrs.map((p) => p.headRefName));
  const openHeads = new Set(prs.map((p) => p.headRefName));
  // Keep every named base, even when other Base lines conflict. An open
  // follow-up may still need a merged worker's branch and worktree.
  const baseBranches = new Set(issues.flatMap(namedBases));
  for (const pr of prs) if (pr.baseRefName) baseBranches.add(pr.baseRefName);
  // A branch a worker pushed for issue n, skipping ones whose PR was closed.
  const branchFor = (n) => remoteBranches.find((b) => new RegExp(`^[^/]+/${n}-`).test(b) && !closedHeads.has(b));
  const worktreeFor = (branch) => worktrees.find((w) => w.branch === branch && w.path !== root);
  // How an issue or PR was closed: COMPLETED, NOT_PLANNED, or null while open
  // or unknown. Only an affirmative answer from GitHub counts as closed.
  const closedAs = (n) => (openIssue.has(n) || prs.some((p) => p.number === n) || !refs[n]?.closed ? null : refs[n].reason);
  const safeToDelete = (branch) =>
    branch && branch !== defaultBranch && !featureBranches.has(branch) && !openHeads.has(branch) && !baseBranches.has(branch);

  const setStatus = (item, status, kind) => {
    const action = statusWrite(item, status);
    github.push(action);
    item.labels = action.labels;
    notes.push(`${kind} #${item.number} → ${status}`);
  };
  const comment = (number, body) => github.push(commentAction(number, body));
  const unclassifiable = new Set();
  const baseError = (item, reason) => {
    unclassifiable.add(item.number);
    notes.push(reason);
    const latest = [...(item.comments ?? [])].reverse().find((c) => /^Author: dispatch\r?\n/.test(c.body ?? ""));
    if (statusOf(item) === "needs-manager" && latest?.body === commentAction(item.number, reason).body) return;
    comment(item.number, reason);
    if (statusOf(item) !== "needs-manager") setStatus(item, "needs-manager", prs.includes(item) ? "PR" : "issue");
  };

  // Conflicting statuses cannot classify work, even after routing the item
  // to the manager. Nothing for it starts or resumes during this wake.
  for (const item of [...issues, ...prs, ...(state.closedCommented ?? [])]) {
    const statuses = item.labels.filter(isStatus);
    if (statuses.length < 2) continue;
    unclassifiable.add(item.number);
    const conflict = statusConflict(item);
    notes.push(conflict.reason);
    github.push(...conflict.github);
    item.labels = conflict.github[1].labels;
    notes.push(`${prs.includes(item) ? "PR" : "issue"} #${item.number} → needs-manager`);
  }

  // Plans describe their inspection base; the parent runs on Feature branch.
  for (const i of issues.filter((i) => !i.labels.includes("type:plan"))) {
    if (unclassifiable.has(i.number)) continue;
    const { error } = explicitIssueBase(i, state);
    if (error) {
      const reason = `Can't classify #${i.number}: ${error}; started nothing. Manager must decide the base.`;
      baseError(i, reason);
    }
  }
  // Children inherit their plan's feature branch, including legacy Base: main.
  for (const i of issues) {
    const base = baseFor(i, state);
    if (base) baseBranches.add(base);
  }

  // 1. Clean up after threads that are done: the issue closed, or the PR the
  // thread worked on closed unmerged after it started (a re-plan). Only the
  // worktree goes, and the branch only when its PR merged; an unmerged
  // branch is the last copy of that work.
  const cleaned = new Set();
  const settleSeen = new Set();
  const settle = (n, t, why) => {
    settleSeen.add(t.threadId);
    // Keep this guard when cleanup also includes settled workers (#48).
    if (t.settled || subtreeBusy(t, true)) return;
    const failure = state.settleFailures?.[t.threadId];
    if (failure?.acknowledged) notes.push(`#${n}: settle ${t.threadId} acknowledged: ${failure.reason}; ${failure.error}`);
    else if (failure && (!tick || state.now < failure.retryAt)) {
      notes.push(`#${n}: settle ${t.threadId} retry ${failure.attempts + 1}/${SETTLE_ATTEMPTS} waits for a later tick at or after ${new Date(failure.retryAt).toISOString()}; ${failure.error}`);
    } else t3.push({ do: "settle", issue: n, threadId: t.threadId, why });
  };
  // Thread input carries no worktree paths, so cleanup waits while any
  // non-factory thread (a human's, say) is running.
  const outsiderBusy = threads.some((x) => active(x) && !rootOf(x).title?.startsWith("Factory ·"));
  const cleanup = (n, branch, pr) => {
    // Another PR may reuse this head while closing an entirely different issue.
    if (!safeToDelete(branch)) return;
    const branchIssue = Number(/^[^/]+\/(\d+)-/.exec(branch)?.[1]);
    if (workers.some((t) => issueOf(t) === branchIssue && subtreeBusy(t))) return;
    const branchPlans = Object.entries(refs).filter(([, r]) => r.featureBranch === branch).map(([n]) => Number(n));
    if (threads.some((t) => branchPlans.includes(Number(/^Factory · parent #(\d+)$/.exec(t.title ?? "")?.[1])) && (subtreeBusy(t) || active(rootOf(t))))) return;
    const wt = worktreeFor(branch);
    // A merged head can be recreated for new work before gathering. Only
    // the exact PR head earns merged cleanup, even if the new tip is pushed.
    if (wt && pr?.merged && (!pr.headRefOid || wt.head !== pr.headRefOid)) return;
    if (wt) {
      github.push({ do: "remove-worktree", issue: n, path: wt.path, branch, expectedHead: wt.head, merged: Boolean(pr?.merged) });
      worktrees = worktrees.filter((w) => w !== wt);
    }
    // Reconcile branches even if their worktree was removed on an earlier wake.
    if (pr?.merged && pr.headRefOid && localBranches.includes(branch) && !worktrees.some((w) => w.branch === branch)) {
      github.push({ do: "delete-local-branch", issue: n, branch, headRefOid: pr.headRefOid });
      localBranches = localBranches.filter((b) => b !== branch);
    }
    if (pr?.merged && pr.headRefOid && remoteBranches.includes(branch)) {
      github.push({ do: "delete-branch", issue: n, branch, headRefOid: pr.headRefOid });
      remoteBranches = remoteBranches.filter((b) => b !== branch);
    }
  };
  for (const [n, t] of cleanupThreads) {
    // A worker, or a review or hunt under it, may still be using the worktree.
    if (subtreeBusy(t) || outsiderBusy || unresolved.length || unclassifiable.has(n) || holding.has(n) || openPrsFor(n).length) continue;
    const issueClosed = closedAs(n) !== null;
    const replacedPr = closedPrs.find(
      (p) => links(p.body, "Closes").includes(n) && !p.merged && p.closedAt && t.createdAt && t.createdAt < p.closedAt,
    );
    if (!issueClosed && !(openIssue.has(n) && replacedPr)) continue;
    const pr = replacedPr ?? closedPrs.find((p) => links(p.body, "Closes").includes(n));
    const branch = pr?.headRefName ?? branchFor(n);
    cleanup(n, branch, pr);
    settle(n, t, `#${n} ${issueClosed ? "closed" : "re-planned"}`);
    cleaned.add(n);
  }
  // A re-plan can start a newer worker before the old one's retry is due.
  // Retain that pending settle without cleaning up the newer worker's work.
  for (const id of Object.keys(state.settleFailures ?? {})) {
    const t = byId.get(id);
    const n = t && issueOf(t);
    if (n == null || threadFor.get(n) === t || settleSeen.has(id) || unresolved.length) continue;
    settle(n, t, `#${n} earlier settle failed`);
  }

  // The thread inventory can omit an old worker entirely. GitHub still has
  // the merged head, but a human thread could now be using its worktree.
  if (!outsiderBusy && !unresolved.length) {
    for (const pr of closedPrs.filter((p) => p.merged)) {
      const ns = [...links(pr.body, "Closes"), ...links(pr.body, "Part of").filter((n) => refs[n]?.featureBranch === pr.headRefName)];
      if (!ns.length && threads.some((t) => active(t) && !isWorker(rootOf(t)) && rootOf(t).title !== "Factory · dispatch")) continue;
      if (ns.some((n) => cleanupThreads.has(n) || holding.has(n) || unclassifiable.has(n) || closedAs(n) === null || openPrsFor(n).length)) continue;
      cleanup(ns[0] ?? pr.number, pr.headRefName, pr);
    }
  }

  // 2. Unblock. Fall back to body dependencies when no Blocked by lines exist.
  const unblockedPrs = new Set();
  for (const item of [...issues, ...prs]) {
    if (unclassifiable.has(item.number)) continue;
    if (!item.labels.includes("blocked")) continue;
    const isPr = prs.includes(item);
    const blockers = item.blockers?.length ? item.blockers : links(item.body, "Depends on");
    if (blockers.length === 0) {
      notes.push(`#${item.number} is blocked with no Blocked by line`);
      continue;
    }
    const states = blockers.map(closedAs);
    if (states.some((s) => s === null)) continue;
    if (states.some((s) => s === "NOT_PLANNED")) {
      setStatus(item, "needs-manager", isPr ? "PR" : "issue");
      const dropped = blockers.filter((b, i) => states[i] === "NOT_PLANNED");
      comment(item.number, `Blocker dropped: ${dropped.map((b) => `#${b}`).join(", ")} closed without being done.`);
    } else if (isPr) {
      // Parent and human-led PRs have no worker to resume; parents come
      // back through the manager on the tick. Ordinary workers choose the
      // next label from same-head review/hunt evidence and factory/check.
      if (links(item.body, "Closes").length) unblockedPrs.add(item.number);
    } else {
      setStatus(item, "agent-ready", "issue");
    }
  }

  // Budget. Over the cap, or when today's spend couldn't be counted, only
  // p0 starts.
  const budget = config.budgetUsd;
  const overBudget = budget != null && !(state.spend?.usd < budget);
  if (budget != null && !state.spend) notes.push(`couldn't count today's spend (${state.spendError ?? "no meter"}); only p0 starts`);
  else if (overBudget) notes.push(`spent $${state.spend.usd.toFixed(2)} of $${budget} today; only p0 starts`);
  if (budget != null && state.spend?.unpriced?.length) notes.push(`no price for ${state.spend.unpriced.join(", ")}; conservative source rates used where available`);

  // 3. Start workers into free slots: stranded PRs, stranded issues, new issues.
  let free = (config.maxParallel ?? 2) - slotsUsed;
  const started = new Set();
  const byPriority = (a, b) => priority(a) - priority(b) || a.createdAt.localeCompare(b.createdAt);

  function newBranch(i) {
    const type = (i.labels.find((l) => l.startsWith("type:")) ?? "type:chore").slice(5);
    const name = `${type}/${i.number}-${slug(i.title)}`;
    let candidate = name;
    for (let k = 2; remoteBranches.includes(candidate) || closedHeads.has(candidate); k++) candidate = `${name}-${k}`;
    return candidate;
  }
  const canCreateBase = (i, base) => {
    const p = links(i.body, "Part of")[0];
    return Boolean(p && base === refs[p]?.featureBranch);
  };

  // One place decides whether issue n may start, so no path can give an
  // issue a second worker or spend past the budget.
  const canStart = (n, item) =>
    free > 0 && n !== finished && !unclassifiable.has(n) && !unclassifiable.has(item.number) && !started.has(n) && !holding.has(n) && !(unresolved.length && threadFor.has(n)) && !(overBudget && priority(item) > 0);
  const startOn = (n, { branch, baseRef, message }) => {
    const t = threadFor.get(n);
    if (t && !cleaned.has(n)) {
      t3.push({ do: "resume", issue: n, threadId: t.threadId, message: `Resume #${n}.${message ? ` ${message}` : ""}` });
    } else {
      let workspaceStrategy;
      if (baseRef) {
        workspaceStrategy = { type: "worktree", baseRef, branch, startFromOrigin: true };
      } else {
        // The branch already exists on origin: reuse or make its worktree.
        let wt = worktreeFor(branch);
        if (!wt) {
          wt = { path: join(homedir(), ".t3", "worktrees", repoName, branch.replaceAll("/", "-")), branch };
          github.push({ do: "add-worktree", issue: n, path: wt.path, branch });
        }
        workspaceStrategy = { type: "existing_worktree", worktreePath: wt.path, branch };
      }
      t3.push({
        do: "launch",
        issue: n,
        title: `Factory · #${n}`,
        workspaceStrategy,
        modelSelection: modelSelection(config, openIssue.get(n)?.labels.includes("ui") && config.jobs?.buildUi ? "buildUi" : "build"),
        runtimeMode: "full-access",
        message: `Follow the worker skill on ${state.repo}#${n}.${message ? ` ${message}` : ""}`,
      });
    }
    started.add(n);
    free -= 1;
  };

  const retryHold = "Read the last issue and PR comments, retry any held step first, and keep reviews already done on this head.";
  const pickup = (p) => `Pick up PR #${p.number} from its labels. ${retryHold}${
    statusOf(p) === "reviewer-ready" ? " Run the reviewers picked under Reviewers in the PR body, in parallel at reviewer-ready, except results already completed on this head before a hold." : ""
  }${p.labels.includes("verifier-ready") ? " Treat legacy verifier-ready as reviewer-ready." : ""}`;

  const strandedPrs = prs
    .filter((p) => links(p.body, "Closes")[0] && (LOOP.includes(statusOf(p)) || unblockedPrs.has(p.number)))
    .sort(byPriority);
  for (const p of strandedPrs) {
    const n = links(p.body, "Closes")[0];
    if (!canStart(n, p)) continue;
    if (openPrsFor(n).length > 1) {
      notes.push(`#${n} has ${openPrsFor(n).length} open PRs; started none`);
      continue;
    }
    const i = openIssue.get(n);
    const base = i && baseFor(i, state);
    if (i && p.baseRefName !== base) {
      unclassifiable.add(n);
      baseError(p, `Can't classify PR #${p.number}: its base \`${p.baseRefName}\` differs from issue #${n}'s resolved base ${base ? `\`${base}\`` : "(missing plan feature branch)"}; started nothing. Manager must decide the base; existing work, branch and thread are kept.`);
      continue;
    }
    if (unblockedPrs.has(p.number)) notes.push(`PR #${p.number} unblocked`);
    startOn(n, { branch: p.headRefName, message: pickup(p) });
  }

  // Held parents use Part of. Resume their existing worker at its stage.
  for (const p of prs.filter((p) => LOOP.includes(statusOf(p)) && !links(p.body, "Closes").length).sort(byPriority)) {
    const n = links(p.body, "Part of")[0];
    const t = workers.find((t) => t.title === `Factory · parent #${n}`);
    if (!n || !t || holds(t) || unresolved.length || !canStart(n, p)) continue;
    t3.push({ do: "resume", issue: n, threadId: t.threadId, message: `Resume parent #${n}. Follow the worker skill's PARENT.md on PR #${p.number} at ${statusOf(p)}: ${statusOf(p) === "reviewer-ready" ? "review any code no review has cleared, walk the flows and hunt" : "fix what the walk, hunt or review found, or what blocks the run, on the feature branch"}. ${retryHold}` });
    started.add(n);
    free -= 1;
  }

  const strandedIssues = issues
    .filter((i) => i.labels.includes("building") && !openPrsFor(i.number).length)
    // A linked parent PR owns the plan's feature branch, at any stage.
    .filter((i) => !i.labels.includes("type:plan") || !prs.some((p) =>
      p.headRefName === refs[i.number]?.featureBranch && links(p.body, "Part of").includes(i.number) && !links(p.body, "Closes").length))
    .sort(byPriority);
  for (const i of strandedIssues) {
    if (!canStart(i.number, i)) continue;
    const branch = branchFor(i.number);
    if (branch) startOn(i.number, { branch, message: retryHold });
    else if (baseFor(i, state)) {
      const base = baseFor(i, state);
      // Only a linked plan owns creation of a missing feature branch.
      if (!threadFor.has(i.number) && base !== defaultBranch && !remoteBranches.includes(base) && canCreateBase(i, base)) {
        github.push({ do: "push-branch", issue: `branch:${base}`, from: defaultBranch, branch: base });
        remoteBranches = [...remoteBranches, base];
      }
      startOn(i.number, { branch: newBranch(i), baseRef: base, message: retryHold });
      if (!threadFor.has(i.number) && base !== defaultBranch) t3.at(-1).after = `branch:${base}`;
    }
  }

  const dependents = (n) => issues.filter((i) => links(i.body, "Depends on").includes(n)).length;
  const ready = issues
    .filter((i) => i.labels.includes("agent-ready") && !i.labels.includes("type:plan") && !openPrsFor(i.number).length)
    .filter((i) => links(i.body, "Depends on").every((d) => closedAs(d) === "COMPLETED"))
    .sort((a, b) => priority(a) - priority(b) || dependents(b.number) - dependents(a.number) || a.createdAt.localeCompare(b.createdAt));
  for (const i of ready) {
    if (!canStart(i.number, i)) continue;
    const base = baseFor(i, state);
    if (base === null) {
      setStatus(i, "needs-manager", "issue");
      comment(i.number, `Can't start: plan #${links(i.body, "Part of")[0]} has no \`Feature branch:\` line.`);
      continue;
    }
    if (base !== defaultBranch && !remoteBranches.includes(base) && canCreateBase(i, base)) {
      github.push({ do: "push-branch", issue: `branch:${base}`, from: defaultBranch, branch: base });
      remoteBranches = [...remoteBranches, base];
    }
    const mark = github.length;
    const markT3 = t3.length;
    setStatus(i, "building", "issue");
    // Work it pushed before it was blocked carries on; a re-plan doesn't.
    const existing = cleaned.has(i.number) ? null : branchFor(i.number);
    if (existing) startOn(i.number, { branch: existing });
    else startOn(i.number, { branch: newBranch(i), baseRef: base });
    // Everything for a child waits on its feature branch being pushed.
    if (base !== defaultBranch) for (const a of [...github.slice(mark), ...t3.slice(markT3)]) a.after = `branch:${base}`;
  }

  // 4. Batch triage every 30 minutes; untriaged p0 issues bypass the wait.
  const untriaged = issues.filter((i) => !statusOf(i) && i.title !== "Triage log" && !i.labels.includes("audit"));
  const triageThreads = threads.filter((t) => t.title === "Factory · triage");
  const triageRunning = triageThreads.some((t) => subtreeBusy(t));
  const lastTriageStarted = Math.max(...triageThreads.map((t) => Date.parse(t.createdAt)).filter(Number.isFinite));
  const triageDue = state.now >= lastTriageStarted + TRIAGE_INTERVAL || untriaged.some((i) => i.labels.includes("p0"));
  if (untriaged.length && !triageRunning) {
    if (!triageDue) notes.push(`Triage waits until ${new Date(lastTriageStarted + TRIAGE_INTERVAL).toISOString()} (30-minute interval)`);
    else t3.push({
      do: "triage",
      issue: null,
      title: "Factory · triage",
      modelSelection: modelSelection(config, "triage"),
      task: `Follow the triage skill on ${state.repo}, run "New issues": ${untriaged.map((i) => `#${i.number}`).join(", ")}.`,
    });
  }

  // 5. Every tick, tell an idle manager about items carrying its labels, and
  // about plans whose children are all done, which need a parent run.
  if (tick) {
    const nudge = new Set();
    // A closed item can still carry a human comment: "deploy" on a merged
    // parent PR.
    for (const item of [...issues, ...prs, ...(state.closedCommented ?? [])]) {
      if (item.labels.some((l) => MANAGER_LABELS.includes(l))) nudge.add(item.number);
    }
    const parentsDue = [];
    // A parent run starts building work, so the budget holds it
    // like any other start.
    for (const p of issues.filter((i) => i.labels.includes("type:plan") && !(overBudget && priority(i) > 0))) {
      if (unclassifiable.has(p.number)) continue;
      const branch = refs[p.number]?.featureBranch;
      if (!branch || !remoteBranches.includes(branch)) continue;
      const openChild = [...issues, ...prs].some((x) => x.headRefName !== branch && links(x.body, "Part of").includes(p.number));
      if (openChild) continue;
      const parent = prs.find((x) => x.headRefName === branch);
      if (parent && unclassifiable.has(parent.number)) continue;
      const live = workers.some((t) => t.title === `Factory · parent #${p.number}` && holds(t));
      let key = null;
      if (live) key = null;
      else if (!parent) key = `${p.number}:parent-run`;
      else if (!statusOf(parent)) key = `${p.number}:parent-run:${parent.number}`;
      else if (parent.labels.includes("blocked") && parent.blockers?.length && parent.blockers.every((b) => closedAs(b) === "COMPLETED"))
        key = `${p.number}:parent-run:${parent.number}:${parent.blockers.join("+")}`;
      if (key && !state.nudged.includes(key)) parentsDue.push(key);
    }
    const manager = threads.find((t) => t.title === "Factory · manager" && !t.parentThreadId);
    const lines = [];
    if (nudge.size) lines.push(`Waiting on you: ${[...nudge].map((n) => `#${n}`).join(", ")}.`);
    if (parentsDue.length) lines.push(`Parent run due for plan ${parentsDue.map((k) => `#${k.split(":")[0]}`).join(", ")}.`);
    if (lines.length && manager && !subtreeBusy(manager)) {
      t3.push({ do: "tell-manager", issue: null, threadId: manager.threadId, message: lines.join(" "), ...(parentsDue.length ? { ack: parentsDue.join(",") } : {}) });
    } else if (lines.length && !manager) {
      notes.push("the manager has work but there's no Factory · manager thread");
    }
  }

  // 6. A dark project with nothing to build researches instead, once a day,
  // on the tick and only with budget left.
  if (tick && dark && !overBudget) {
    // Untriaged issues still prevent idle research while triage waits.
    const idle = slotsUsed === 0 && started.size === 0 && !untriaged.length && !triageRunning;
    // The local day, the same one the budget counts.
    const day = new Date(state.now);
    const key = `research@${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const researching = threads.some((t) => t.title === "Factory · research" && subtreeBusy(t));
    if (idle && !researching && !state.nudged.includes(key)) {
      t3.push({
        do: "research",
        issue: null,
        title: "Factory · research",
        modelSelection: modelSelection(config, "research"),
        task: `Follow the researcher skill on ${state.repo}, an open run: the factory has nothing to build.`,
        ack: key,
      });
    }
  }

  return { github, t3, notes, started: [...started], cleaned: cleanupIssues(github) };
}

// ---------------------------------------------------------------------------
// Everything below talks to the outside world.

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}
const gh = (...args) => sh("gh", args);
const ghJson = (...args) => JSON.parse(gh(...args) || "null");

function readFromMain(repo, path) {
  try {
    return Buffer.from(ghJson("api", `repos/${repo}/contents/${path}`).content, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function listAll(kind, repo, state, fields, runGh = gh) {
  const rows = JSON.parse(runGh(kind, "list", "-R", repo, "--state", state, "--limit", String(LIST_LIMIT), "--json", fields));
  if (state === "open" && rows.length >= LIST_LIMIT) throw new Error(`more than ${LIST_LIMIT} open ${kind}s; refusing to plan from a partial list`);
  return rows;
}

function gather(repo, root, tick, threads, configPath) {
  const configText = configPath ? readFileSync(configPath, "utf8") : readFromMain(repo, "factory.json");
  const gitignore = readFromMain(repo, ".gitignore") ?? "";
  if (!configText) return { stop: "factory.json isn't on the default branch" };
  if (!/^\/?\.scratch\/?$/m.test(gitignore)) return { stop: ".scratch/ isn't in .gitignore on the default branch" };
  const config = JSON.parse(configText);
  const defaultBranch = ghJson("api", `repos/${repo}`).default_branch;

  const flat = (x) => ({ ...x, labels: x.labels.map((l) => l.name) });
  const issues = listAll("issue", repo, "open", "number,title,labels,body,createdAt").map(flat);
  const prs = listAll("pr", repo, "open", "number,title,labels,body,headRefName,baseRefName,createdAt").map(flat);
  const closedPrs = ghJson("pr", "list", "-R", repo, "--state", "closed", "--limit", "100", "--json", "number,body,headRefName,headRefOid,mergedAt,closedAt").map(
    (p) => ({ ...p, merged: Boolean(p.mergedAt) }),
  );

  const refs = {};
  const ref = (n) => {
    if (refs[n]) return refs[n];
    const r = ghJson("api", `repos/${repo}/issues/${n}`);
    return (refs[n] = refFromIssue(r));
  };
  for (const item of [...issues, ...prs]) {
    if (item.labels.includes("blocked") || item.labels.includes("needs-manager")) {
      item.comments = ghJson("api", `repos/${repo}/issues/${item.number}/comments`, "--paginate");
    }
    if (item.labels.includes("blocked")) {
      item.blockers = blockerLinks(item.body, item.comments);
      item.blockers.forEach(ref);
    }
    links(item.body, "Depends on").forEach(ref);
    links(item.body, "Part of").forEach(ref);
  }
  for (const p of issues.filter((i) => i.labels.includes("type:plan"))) ref(p.number);
  for (const t of threads) {
    const m = /^Factory · #(\d+)$/.exec(t.title ?? "");
    if (m && !issues.some((i) => i.number === Number(m[1]))) ref(Number(m[1]));
  }

  // The closed-PR list above is only the latest 100. For any branch a
  // worker might pick back up, ask GitHub directly whether its PR closed.
  const remoteBranchesRaw = sh("git", ["ls-remote", "--heads", "origin"], { cwd: root })
    .split("\n")
    .filter(Boolean)
    .map((l) => l.split("refs/heads/")[1]);
  const live = new Set(issues.filter((i) => ["agent-ready", "building", "blocked"].some((l) => i.labels.includes(l))).map((i) => i.number));
  const known = new Set(closedPrs.map((p) => p.headRefName));
  for (const b of remoteBranchesRaw) {
    const n = Number(/^[^/]+\/(\d+)-/.exec(b)?.[1]);
    if (!live.has(n) || known.has(b)) continue;
    const older = ghJson("pr", "list", "-R", repo, "--head", b, "--state", "closed", "--json", "number,body,headRefName,headRefOid,mergedAt,closedAt");
    for (const p of older) closedPrs.push({ ...p, merged: Boolean(p.mergedAt) });
  }

  const worktrees = [];
  for (const block of sh("git", ["worktree", "list", "--porcelain"], { cwd: root }).split("\n\n")) {
    const path = /^worktree (.+)$/m.exec(block)?.[1];
    const branch = /^branch refs\/heads\/(.+)$/m.exec(block)?.[1];
    const head = /^HEAD (.+)$/m.exec(block)?.[1];
    if (path) worktrees.push({ path, branch, head });
  }
  const remoteBranches = remoteBranchesRaw;
  const localBranches = sh("git", ["for-each-ref", "--format=%(refname:short)", "refs/heads"], { cwd: root }).split("\n").filter(Boolean);
  for (const p of closedPrs.filter((p) => p.merged && (remoteBranches.includes(p.headRefName) || localBranches.includes(p.headRefName)))) {
    links(p.body, "Closes").forEach(ref);
    links(p.body, "Part of").forEach(ref);
  }

  const settleFailures = readSettleFailures(root, threads);
  const stateFile = nudgedFile(root);
  const nudged = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : [];
  let closedCommented = [];
  if (tick) {
    const found = ghJson("api", "-X", "GET", "search/issues", "-f", `q=repo:${repo} label:human-comment state:closed`, "-f", "per_page=100");
    if (found.total_count > found.items.length) throw new Error(`more than ${found.items.length} closed items carry human-comment; refusing to nudge from a partial list`);
    closedCommented = found.items.map(flat);
  }
  return { repo, root, config, defaultBranch, issues, prs, closedPrs, closedCommented, refs, threads, worktrees, remoteBranches, localBranches, nudged, settleFailures, now: Date.now() };
}

const nudgedFile = (root) => join(root, ".scratch", "dispatch", "nudged.json");
const settleFile = (root) => join(root, ".scratch", "dispatch", "settles.json");
const readJson = (file, fallback) => existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback;
const saveJson = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
};

function clearSettle(root, failures, threadId) {
  delete failures[threadId];
  // Clear acknowledgements written by the original blanket --ack policy too.
  const file = nudgedFile(root);
  const nudged = readJson(file, []);
  const kept = nudged.filter((key) => key !== `settle:${threadId}`);
  if (kept.length !== nudged.length) saveJson(file, kept);
}

export function readSettleFailures(root, threads = null) {
  // Unsupported stock execution must stop before GitHub/git or local T3-state writes.
  throw new Error("Stock T3 CLI dispatch is unsupported; use parent manual native-Sol dispatch.");
  const failures = readJson(settleFile(root), {});
  // Only a complete planning snapshot proves a thread has disappeared.
  // Result recording reads without one and must preserve other threads.
  if (threads !== null) {
    const listed = new Set(threads.map((t) => t.threadId));
    const legacy = readJson(nudgedFile(root), []).filter((key) => key.startsWith("settle:")).map((key) => key.slice(7));
    for (const id of new Set([...Object.keys(failures), ...legacy])) {
      if (listed.has(id)) continue;
      const hadFailure = Object.hasOwn(failures, id);
      clearSettle(root, failures, id);
      if (hadFailure) saveJson(settleFile(root), failures);
    }
  }
  // The previous policy counted and permanently acknowledged busy refusals.
  for (const [id, failure] of Object.entries(failures)) {
    if (failure.reason !== "refused" || !settleWaitingForIdle(id, failure.error)) continue;
    Object.assign(failure, { attempts: Math.max(0, failure.attempts - 1), acknowledged: false, reason: "waiting-for-idle" });
    saveJson(settleFile(root), failures);
  }
  for (const t of threads ?? []) {
    if (!t.settled) continue;
    const hadFailure = Object.hasOwn(failures, t.threadId);
    clearSettle(root, failures, t.threadId);
    if (hadFailure) saveJson(settleFile(root), failures);
  }
  return failures;
}

function settleWaitingForIdle(threadId, error) {
  // T3 currently exposes this refusal as a message, without a distinct code.
  // Parse the ID separately so another thread's refusal cannot match.
  const refusal = /^Thread\s+(\S+)\s+has\s+active\s+or\s+blocked\s+work[\s,;:.!?]*(?:and[\s,;:.!?]+)?cannot\s+be\s+settled[\s.!?]*$/i.exec(error ?? "");
  return refusal?.[1] === threadId;
}

export function recordSettleResult(root, threadId, result, now = Date.now()) {
  // Unsupported stock execution must stop before GitHub/git or local T3-state writes.
  throw new Error("Stock T3 CLI dispatch is unsupported; use parent manual native-Sol dispatch.");
  if (!threadId || !result || (result.ok !== true && typeof result.error !== "string")) {
    throw new Error('settle result must be {"ok":true} or {"error":"exact T3 message"}');
  }
  const failures = readSettleFailures(root);
  if (result.ok === true) {
    clearSettle(root, failures, threadId);
    saveJson(settleFile(root), failures);
    return { cleared: `settle:${threadId}`, notes: [] };
  }
  const error = result.error.trim();
  const waiting = settleWaitingForIdle(threadId, error);
  const attempts = (failures[threadId]?.attempts ?? 0) + (waiting ? 0 : 1);
  const acknowledged = !waiting && attempts >= SETTLE_ATTEMPTS;
  const reason = waiting ? "waiting-for-idle" : acknowledged ? `gave up after ${SETTLE_ATTEMPTS} attempts` : "retryable";
  failures[threadId] = { attempts, error, acknowledged, reason, retryAt: now + HOUR };
  saveJson(settleFile(root), failures);
  const note = `settle ${threadId}: ${reason}; ${error}`;
  return { ...(acknowledged ? { acked: `settle:${threadId}`, reason } : { retryAt: now + HOUR }), notes: [note] };
}

// A worktree goes only if nothing in it would be lost: no uncommitted
// changes, and its commits are on origin or its PR merged.
function worktreeIsSafe(path, merged, root) {
  if (sh("git", ["-C", path, "status", "--porcelain"])) return "it has uncommitted changes";
  if (merged) return null;
  sh("git", ["fetch", "origin"], { cwd: root });
  const onRemote = sh("git", ["-C", path, "branch", "-r", "--contains", "HEAD"]);
  return onRemote ? null : "its commits aren't on origin";
}

export function apply(state, result, runGh = gh) {
  // Unsupported stock execution must stop before GitHub/git or local T3-state writes.
  throw new Error("Stock T3 CLI dispatch is unsupported; use parent manual native-Sol dispatch.");
  const { repo, root } = state;
  const done = [];
  const failed = new Set();
  let cleanupReadError;
  for (let a of result.github) {
    let changed = false;
    if ((a.issue != null && failed.has(a.issue)) || (a.after && failed.has(a.after))) {
      done.push({ ...a, ...(isCleanup(a) ? { changed } : {}), ok: false, error: "skipped: an earlier step for this issue failed" });
      continue;
    }
    try {
      if (isCleanup(a)) {
        // New PRs and issue dependencies can reuse a merged head after planning.
        // Re-read before each destructive step; any read failure holds cleanup.
        let openPrs, openIssues, liveState;
        if (!cleanupReadError) {
          try {
            openPrs = listAll("pr", repo, "open", "headRefName,baseRefName", runGh);
            openIssues = listAll("issue", repo, "open", "number,labels,body", runGh)
              .map((i) => ({ ...i, labels: i.labels.map((l) => l.name) }));
            const refs = {};
            const planNumbers = openIssues.filter((i) => i.labels.includes("type:plan")).map((i) => i.number);
            for (const n of new Set([...planNumbers, ...openIssues.flatMap((i) => links(i.body, "Part of"))])) {
              refs[n] = refFromIssue(JSON.parse(runGh("api", `repos/${repo}/issues/${n}`)));
            }
            liveState = { ...state, refs };
          } catch (e) {
            cleanupReadError = e;
          }
        }
        if (cleanupReadError) throw cleanupReadError;
        if (openPrs.some((p) => p.headRefName === a.branch)) throw new Error(`kept ${a.branch}: it is an open PR head`);
        if (openPrs.some((p) => p.baseRefName === a.branch)) throw new Error(`kept ${a.branch}: it is an open PR base`);
        if (protectedFeatureBranches(liveState.refs).has(a.branch)) throw new Error(`kept ${a.branch}: it is an open plan feature branch`);
        if (openIssues.some((i) => namedBases(i).includes(a.branch) || baseFor(i, liveState) === a.branch)) {
          throw new Error(`kept ${a.branch}: it is an open issue base`);
        }
        if (openIssues.some((i) => !baseFor(i, liveState))) throw new Error("kept cleanup: an open issue base could not be resolved");
      }
      if (a.do === "label") {
        // Compare the planned status with a fresh read before replacing it,
        // carrying every other current label. GitHub has no CAS, so verify
        // the write before releasing any action that depends on it.
        const endpoint = `repos/${repo}/issues/${a.number}/labels`;
        const readLabels = () => JSON.parse(runGh("api", endpoint, "--paginate", "--slurp")).flat().map((l) => l.name);
        let now = readLabels();
        const current = now.filter(isStatus);
        const matches = current.length === a.expectedStatuses.length && current.every((l) => a.expectedStatuses.includes(l));
        // A planned conflict resolution already has a successful comment
        // immediately before it. A new conflict needs its own comment first.
        if (current.length > 1 && !(matches && a.labels.includes("needs-manager"))) {
          const conflict = statusConflict({ number: a.number, labels: now });
          failed.add(a.issue);
          done.push({ ...a, ok: false, error: conflict.reason });
          result.notes.push(conflict.reason);
          result.notes.push(`#${a.number} held: status conflict; next wake will re-plan from fresh state`);
          a = conflict.github[0];
          runGh("api", `repos/${repo}/issues/${a.number}/comments`, "-f", `body=${a.body}`);
          done.push({ ...a, ok: true });
          a = conflict.github[1];
          // The comment must succeed before resolving the conflict. Re-read
          // afterwards in case the manager changed the status meanwhile.
          now = readLabels();
          const afterComment = now.filter(isStatus);
          if (afterComment.length !== a.expectedStatuses.length || !afterComment.every((l) => a.expectedStatuses.includes(l))) {
            throw new Error(`status changed after conflict comment: expected ${a.expectedStatuses.join(", ")}, found ${afterComment.join(", ") || "no status"}`);
          }
        } else if (!matches) {
          throw new Error(`status changed since gather: expected ${a.expectedStatuses.join(", ") || "no status"}, found ${current.join(", ") || "no status"}`);
        }
        const status = a.labels.find(isStatus);
        const labels = [...now.filter((l) => !isStatus(l)), status];
        runGh("api", "-X", "PUT", endpoint, ...labels.flatMap((l) => ["-f", `labels[]=${l}`]));
        const actual = readLabels().filter(isStatus);
        if (actual.length !== 1 || actual[0] !== status) {
          throw new Error(`status verification failed: expected only ${status}, found ${actual.join(", ") || "no status"}`);
        }
      } else if (a.do === "comment") {
        runGh("api", `repos/${repo}/issues/${a.number}/comments`, "-f", `body=${a.body}`);
      } else if (a.do === "remove-worktree") {
        const unsafe = worktreeIsSafe(a.path, a.merged, root);
        if (unsafe) throw new Error(`kept ${a.path}: ${unsafe}`);
        // The merged flag belongs to the planned checkout. A detached commit
        // or a different checkout may have appeared while this plan waited.
        const branch = sh("git", ["-C", a.path, "rev-parse", "--abbrev-ref", "HEAD"]);
        const head = sh("git", ["-C", a.path, "rev-parse", "HEAD"]);
        if (branch === "HEAD") throw new Error(`kept ${a.path}: it is detached`);
        if (branch !== a.branch) throw new Error(`kept ${a.path}: its branch changed from ${a.branch} to ${branch}`);
        if (!a.expectedHead || head !== a.expectedHead) throw new Error(`kept ${a.path}: its HEAD differs from the planned HEAD`);
        sh("git", ["worktree", "remove", a.path], { cwd: root });
        changed = true;
      } else if (a.do === "delete-local-branch") {
        const ref = `refs/heads/${a.branch}`;
        const checkedOut = sh("git", ["worktree", "list", "--porcelain"], { cwd: root }).split("\n").includes(`branch ${ref}`);
        const row = sh("git", ["for-each-ref", "--format=%(refname) %(objectname)", ref], { cwd: root }).split("\n").find((l) => l.startsWith(`${ref} `));
        const tip = row?.slice(ref.length + 1);
        if (checkedOut) result.notes.push(`kept local branch ${a.branch}: it is checked out`);
        else if (tip && tip === a.headRefOid) {
          sh("git", ["update-ref", "-d", ref, a.headRefOid], { cwd: root });
          changed = true;
        } else if (tip) result.notes.push(`kept local branch ${a.branch}: its tip differs from the merged PR head`);
      } else if (a.do === "delete-branch") {
        if (!a.headRefOid) throw new Error(`kept remote branch ${a.branch}: missing merged PR head SHA`);
        const ref = `refs/heads/${a.branch}`;
        const row = sh("git", ["ls-remote", "--heads", "origin", ref], { cwd: root }).split("\n").find((l) => l.split("\t")[1] === ref);
        const tip = row?.split("\t")[0];
        if (tip && tip === a.headRefOid) {
          sh("git", ["push", `--force-with-lease=${ref}:${a.headRefOid}`, "origin", `:${ref}`], { cwd: root });
          changed = true;
        } else if (tip) result.notes.push(`kept remote branch ${a.branch}: its tip differs from the merged PR head`);
      } else if (a.do === "push-branch") {
        sh("git", ["fetch", "origin", a.from], { cwd: root });
        sh("git", ["push", "origin", `origin/${a.from}:refs/heads/${a.branch}`], { cwd: root });
      } else if (a.do === "add-worktree") {
        sh("git", ["fetch", "origin", a.branch], { cwd: root });
        mkdirSync(dirname(a.path), { recursive: true });
        sh("git", ["worktree", "add", a.path, a.branch], { cwd: root });
      }
      done.push({ ...a, ...(isCleanup(a) ? { changed } : {}), ok: true });
    } catch (e) {
      if (a.issue != null) failed.add(a.issue);
      const error = String(e.stderr || e.message).trim().split("\n")[0];
      done.push({ ...a, ...(isCleanup(a) ? { changed } : {}), ok: false, error });
      if (a.do === "label") result.notes.push(`#${a.number} held: ${error}; next wake will re-plan from fresh state`);
    }
  }
  const isHeld = (a) => (a.issue != null && failed.has(a.issue)) || (a.after && failed.has(a.after));
  return { done, cleaned: cleanupIssues(done, true), failed, held: result.t3.filter(isHeld), t3: result.t3.filter((a) => !isHeld(a)) };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? null : args[i + 1];
  };
  const root = sh("git", ["rev-parse", "--show-toplevel"]);

  if (opt("settle-result")) {
    const result = JSON.parse(readFileSync(0, "utf8"));
    console.log(JSON.stringify(recordSettleResult(root, opt("settle-result"), result)));
    return;
  }

  if (opt("ack")) {
    const file = nudgedFile(root);
    const prev = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify([...new Set([...prev, ...opt("ack").split(",")])], null, 2));
    console.log(JSON.stringify({ acked: opt("ack").split(",") }));
    return;
  }

  const repo = opt("repo");
  if (!repo) throw new Error("--repo owner/name is required");
  const finished = opt("finished") ? Number(opt("finished")) : null;
  const tick = args.includes("--tick");
  const input = readFileSync(0, "utf8").trim();
  const parsed = input ? JSON.parse(input) : [];
  const threads = Array.isArray(parsed) ? parsed : parsed.threads ?? [];

  const state = gather(repo, root, tick, threads, opt("config"));
  if (state.stop) {
    console.log(JSON.stringify({ stop: state.stop, t3: [] }, null, 2));
    return;
  }
  if (state.config.budgetUsd != null) {
    try {
      const { spentToday } = await import("./usage.mjs");
      state.spend = await spentToday({ root, now: new Date(state.now) });
    } catch (e) {
      state.spendError = String(e.message).split("\n")[0];
    }
  }
  const result = plan(state, { finished, tick });
  const out = { ...result };
  if (args.includes("--apply")) {
    const { done, cleaned, held, t3 } = apply(state, result);
    out.github = done;
    out.cleaned = cleaned;
    // T3 steps for an issue whose GitHub steps failed wait for the next wake.
    out.held = held;
    out.t3 = t3;
  }
  console.log(JSON.stringify(out, null, 2));
}

let entryPath;
try {
  entryPath = process.argv[1] && realpathSync(process.argv[1]);
} catch {
  // A non-file entry argument means this module is being imported.
}
// Stock T3 execution is unsupported; native cloud dispatch uses the estimated ledger.
if (entryPath === realpathSync(fileURLToPath(import.meta.url))) {
  const config = JSON.parse(readFileSync(new URL("../../../factory.json", import.meta.url), "utf8"));
  const admission = assessActivation(config);
  console.log(JSON.stringify({ stop: admission.reasons.join(" "), t3: [] }, null, 2));
  process.exitCode = 1;
}
