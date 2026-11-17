Author: independent review · Nov17 bounded selector hygiene
Review: 360386bb4e7cf9b51a4ddf772000197f4fb4efb0 · round 1
Verdict: clear, source-only partial issue #28

## Identity and scope
Authenticated Git-data commit and recursive tree were fetched independently. Remote head 360386bb4e7cf9b51a4ddf772000197f4fb4efb0 has tree f71d404346b0569b2752c53c883996b419f4597a and sole parent b55ef2e899460e96a3de2d155693cacc9613266f (tree 7bcb90e803696cb2d30d573b7896a0eaa8b23af7). Actual metadata reconstructed the exact remote SHA with +0800 author/committer timestamps and no final message newline, not an assumed local SHA. Local ec75226f0c754fdec14407048cf7168f1438e645 has the identical full tree/sole parent. Remote main was read and remains b55ef2e899460e96a3de2d155693cacc9613266f. The untruncated remote tree contains 700 entries: 626 blobs and 74 subtrees. All local recursive blob path/mode/hash entries equal remote; all active worktree blob bytes match. Prohibited old_code was not read for the source review. Historical ancestry beyond the explicit shallow base is not certified.

Actual issue #28 and its sole migration comment, current AGENTS, CODING_STANDARDS, ERRORS, DESIGN, CONTEXT Realism, review skill and docs/factory/READINESS were read. Manual v3 pin 7d756086b9938635e0cd11064a4d337eae747326 and maxParallel 1 remain unchanged. Scope is exactly four files, 3 insertions/8 deletions: three unused selectors, only their solely dead import specifiers, and their three architecture backlog names. No source fixes or scope expansion were needed.

## Independent code evidence
Own TypeScript AST audit parses 187 tracked JS/TS-family files, excluding prohibited dead old_code. The three identifiers appear only at their original declarations. No target string literal or target named import/reexport/call/property lookup exists. All 62 import/reexport statements into the owners were inventoried. Runtime dynamic/namespace/global exposure was checked; the app has no dynamic import/eval/Function/require/import.meta.glob of these owners, no target-name lookups, and no computed window/globalThis/self exposure. The package is private and index.html enters src/main.tsx, not an external SDK.

Two namespace imports DO exist in tests/career/careerModule.test.ts. They were inspected: balanceContract asserts eight retained compatibility operations and shared tuning identity; intrigueContract enumeration compares only names also present in the career entrypoint. consortHostility is not in that set, invoked or asserted. careerSeniorRival remains unchanged. Application callers import retained graph, intrigue and balance operations directly through the existing owners; their public contracts and complete bodies are byte-preserved.

Own AST-located exact retained-byte reconstruction independently equals all three candidate source files after removing only their declaration plus its newline and the two explicit import edits. The README equals the base after removing only the three backlog names. No removed declaration owns JSDoc. consortHostility and graphBackers are inert function declarations; careerWindow is an arrow-function constant whose creation does not invoke its body. None performs declaration-time mutation, RNG, calls or registration. Removing promotionHate's value binding does not remove Career module evaluation: careerSeniorRival reexport remains, as do campaignBalance's live CAREER_RULES import/compatibility reexports. PalaceZone stays type-only and Career is removed only where dead. All live types, bodies, comments, callers, save/schema, event and actor behavior remain unchanged.

Three source files shrink 26→23, 53→52 and 134→133 lines. No oversized file grows. No CSS/JSX/tests/config/baselines/dependencies/hooks/any/wrappers/features were added. The one-off ignored AST audit is review evidence, not a source-grep/Markdown-regex product test.

## Fresh independent execution
Node 24.22.1; existing compatible installed packages and pinned hosted assets only, with no installation/download. Own isolated exact-base active source materialization, never the old Oct23 head, supplied the fresh baseline.

- Exact-base assets:verify: PASS, exit 0; 131 verified, 0 downloaded.
- Exact-base npm run build: PASS, exit 0; 129 hosted binaries pruned.
- Immutable candidate npm run factory:check: PASS, exit 0. Selected hygiene, 25 factory policy/contracts tests and 497 MAIN app/CLI tests, all pass with zero failures/cancelled/skipped/todo. Src-only typecheck passes. Pretest verifies 131 pins/0 downloads, build prunes 129.
- Own production inventories compare all 285 paths, modes, lengths, SHA-256 and direct bytes: IDENTICAL, 23,847,739 bytes each, no exceptions. JS index-Cpi_IKoM.js and CSS index-ogLC6n1w.css, all HTML/fonts/metadata/names/references are unchanged.
- git diff --check: PASS. Candidate source remains clean. Original proof/input snapshot before and after: 319 files exactly unchanged. Actual source SHA256SUMS verifies all 311 entries; INPUT-SHA256SUMS verifies all 8 entries. Its proof-manifest reference is verified, not assumed from old counts.

The aggregate includes existing public career/graph/intrigue/campaign/actor/save tests; no separate focused subset or old 83/567/573 count is claimed. No full baseline aggregate or 100-seed study was needed/run. Source worker pre-freeze/frozen runs are not counted as independent or additional coverage here.

Warnings remain unsuppressed: npm unknown environment config http-proxy and Vite >500kB minified chunk. Hygiene is selected debt coverage, not full ESLint/dead-code certification; TypeScript covers src, not tests/scripts.

## Execution limits and preserved boundaries
An initial remote-tree evidence persistence command exceeded argv size before process creation. Small scoped chunks succeeded; this was not a policy denial. Later an evidence-summary command accidentally omitted require_escalated and failed writing only own manifest-and-counters.json with OSError Errno 30 read-only filesystem. That write was stopped and that target was not retried; no evasion, source change or security/network change occurred. Read-only manifest verification completed separately, with counts above. All successful artifact/build writes used the supported scoped require_escalated route. The failed summary JSON remains absent. No test/build failed.

This role remains within the parent's existing USD5 reservation, including later exact-doc closeout. No new agent/job/admission, remote/ref write, issue/PR communication/closure, installation/download, paid service/purchase, account/credential/security grant, quota export or telemetry occurred.

No browser/CDP/CUA/headless/launcher/DevTools/DOM/storage/tunnel retry or Cloudflare reauth was attempted. Existing denials remain unresolved; rediscovery is not authorization. All actual browser/hosted/replay/controls/gait/CSS/touch/roles/reduced-motion, H2/P0 #41/#42 and parent release gates remain OPEN. Static/byte-identical output is not browser proof. Existing active/public Site V57/source abbf403ef771569533b802a88691696db4f0ce94 remains unchanged.

This clear verdict authorizes no Site publication, main update, pending integration or full issue #28 completion. getRank, hasPromotedOffice, getDisabledActions, locked-audience/pending-label and remaining acceptance stay OPEN. Pending source 725a0fa51f58af28dadf216ea696216f286cda41 and original 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b branches were not mutated; no new claims about absent Nov13–16 raw logs or old preservation artifacts are made.

### Exact default-sandbox incident
The failed exec_command omitted sandbox_permissions. It ran this exact shell command:
```sh
cd .scratch/harem-nov17-selectors/repo && python - <<'PY'
import pathlib,hashlib,json,re
O=pathlib.Path('.scratch/independent-review-nov17'); results={}
for manifest,root in [(pathlib.Path('.scratch/selector-proof/SHA256SUMS'),pathlib.Path('.scratch/selector-proof')),(pathlib.Path('../INPUT-SHA256SUMS'),pathlib.Path('..'))]:
 lines=manifest.read_text().splitlines()
 for line in lines:
  h,p=line.split('  ',1); assert hashlib.sha256((root/p).read_bytes()).hexdigest()==h,p
 results[str(manifest)]={'entries':len(lines),'verified':True}
log=(O/'factory-check.log').read_text(); results['aggregateCounters']=re.findall(r'# (?:tests|pass|fail|cancelled|skipped|todo) \d+',log); results['assets']=re.findall(r'.*(?:131|download|Unknown env config|hygiene).*',log)
(O/'manifest-and-counters.json').write_text(json.dumps(results,indent=2)+'\n'); print(json.dumps(results,indent=2))
PY
```
Full failed target: `/workspace/scratch/5e0e15dcbbf8/.scratch/harem-nov17-selectors/repo/.scratch/independent-review-nov17/manifest-and-counters.json`.
Result: default-sandbox `OSError: [Errno 30] Read-only file system`, exit 1. No file was created; a subsequent read-only ls confirmed it absent. This was not an automated approval-review denial. That file was never retried and the denied optional summary payload was not persisted under another path. All original independently produced logs/exits, identity/tree/rawcommit, AST/deletion, inventories/direct-byte comparison, preservation snapshots and checks.json remain available unchanged. Read-only verification subsequently confirmed the two manifest counts and actual Node reporter 25/497 results. The results regex in the failed optional command expected TAP-style # counters, while actual Node output uses ℹ; the correct counts above were read from actual logs, not this absent summary.
