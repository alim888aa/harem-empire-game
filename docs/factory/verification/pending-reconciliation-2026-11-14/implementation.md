# November 14 pending-runtime reconciliation (PENDING ONLY)

## Frozen result
- Local exact candidate head: bcd78bc799135afab963cc329008360c100400df.
- Exact tested tree: 6821c99cc7cdd1ed7a56574a9972ccf50f185c34 (617 tracked paths).
- Real merge parents: authenticated admission/current-main d58563c748d1b703f8766bb1626d130d0a82daa8, then original pending 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b.
- Current-main tree: df336eec55c8f83da6f0e7fe598658ca7bf9e749.
- Original pending tree: c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b.
- Authenticated explicit common base: f509c699af09d1a8ee00b9dc32dade8bd65ae6e4 / tree 3f69aec0f09d2bd42d88383fab753e1530e9553b.
- No further source changes are planned. Independent review follows this frozen result. A remote commit with different metadata may have a different head; its tree must equal the tested tree and its real parents must preserve both inputs. No runtime-main update is authorized by this report.

## Integration and source preservation
Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, worker/PARENT and factory-workflow/READINESS guidance. Existing reviewed runtime changes were integrated, not implemented again.
The supported authenticated GitHub connector supplied both Nov14 admission files as base64 with verified blob identities and the Git-data commit metadata. The imported admission tree and commit SHA both matched exactly; the SHA-verified metadata uses +0800 and no trailing message newline. See admission-provenance.json and admission.commit.
A local clone failed because an existing history object (1a6efe61fb9c54b4cc59a0b2cc506c1dab67064b) is missing. This was a Git ancestry error, not a filesystem denial. An authorized isolated copy of the existing Git database then succeeded. No complete ancestry was fabricated.
Command: git merge-tree --write-tree --merge-base=f509c699af09d1a8ee00b9dc32dade8bd65ae6e4 d58563c748d1b703f8766bb1626d130d0a82daa8 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b
Result: tree 6821c99cc7cdd1ed7a56574a9972ccf50f185c34, exit0, no conflicts/messages beyond the tree.

The complete per-path assertion in complete-input-candidate-identity.json passed:
- Zero paths changed by both main and pending relative to the explicit common base.
- Every pending-changed path in the candidate has exactly the original pending mode/type/blob, including deletion of the two renamed old paths.
- Every other candidate path has exactly current-main mode/type/blob.
- Raw no-rename base-to-pending delta is byte-identical to current-main-to-candidate raw delta (24 raw paths, or 22 rename-aware paths).
- All 127 protected current-main paths match, including .gitignore, CAMPAIGN_BALANCE.md, scripts/simulate-campaign.ts, tests/campaignSimulator.test.ts and every current-main docs/factory path. All accounting and evidence survive.
- No resolution-generated content, new features, refactor, hooks, dependency edits or test additions. The jsdom/lock and camera-folder changes are the existing pending bytes. No baseline/check weakening.
- Nov13 archived bytes: blob f93cb95c131647206bdf661b7328cae0bea34164; SHA256 d3b870ea97e0043486c74ac982b3d20e56b5b246f6ef8446fe1991fe8a8a2d64, exact authenticated archive.

## Fresh checks on the exact candidate
Required command: npm run factory:check. Exit0, factory-check.log / factory-check.exit.
- Selected hygiene passed: explicitAny31, alerts5, consoleLogs49, unseededRandom6, longLines695, oversizedFiles7. This is the inherited selected ratchet, not full ESLint/dead-code certification.
- Factory tests: 25 passed, zero failed/cancelled/skipped/todo.
- Source TypeScript typecheck passed.
- Runtime verification: 131 files, zero downloads; all pinned SHA256 hashes passed.
- Application/CLI tests: 573 passed, zero failed/cancelled/skipped/todo, duration 28069.717979ms.
- Production tsc/Vite build passed; 129 hosted binaries pruned, attribution/metadata retained.
- Existing Vite >500kB chunk warning: main JS 1266.79kB / gzip364.24kB. Warning, not a failure. Npm unknown-http-proxy and update notices are not check failures; nothing was installed or updated.

Additional existing public-interface command:
node --import tsx --test tests/camera/*.test.ts tests/palace/*.test.ts tests/courtDialog.test.ts tests/princePlayerModel.test.ts tests/touch-gestures.test.ts tests/campaignSimulator.test.ts
Exit0: 119 passed, zero failed/cancelled/skipped/todo, duration19150.635877ms. Covers existing camera clearance/entry/conversation, navigation/collision, pose persistence/reconstruction, dialog lifecycle, player model/gait contracts, touch interruptions/deduplication and six actual simulator CLI report-path/write-failure cases. These are executed Node/interface checks, not browser proof or a fresh balance study.

## Scope and permission outcomes
Cloud-only, current assigned job, no subagents or new jobs. Existing reserved USD8 source estimate used; no ledger changes made. Work remains within manual v3 pin7d756086b9938635e0cd11064a4d337eae747326/maxParallel1 source scope.
Scoped require_escalated reviews for ordinary isolated candidate/Git-object/artifact writes, asset reuse and actual checks were allowed. No write/check was denied. No security-setting, credential, persistent-grant or network-transport change. The failed local clone above was not retried as a permission bypass. Existing Git database copying was a supported local incomplete-history remedy inside the approved isolated target.
Dependencies were reused by read-only symlink to existing harem-oct23/node_modules; 131 pinned assets copied from existing verified local files. No npm install, fetch/download, paid service, account, purchase, telemetry/quota export, direct github.com network transport or credential handling.
No external comments, issues, PR actions, remote Git writes, original pending branch changes, main ref changes or Site changes.

## Unrun gates and blockers
Browser launch, hosted/browser acceptance, controls/replay/gait visual verification, CSS/touch/role/reduced-motion/historical-H2 proof and release approval: NEVER RUN in this job, remain open. November12 singleton-socket/ptrace Operation not permitted exit133 is not resolved or retried. No CUA/headless/CDP/alternate launcher/flags/tunnel/DOM/storage route attempted.
Cloudflare reauthentication remains outside this scope. P0 #41/#42 remain open. Public active Site V57/sourceabbf403ef771569533b802a88691696db4f0ce94 at the existing public destination remains unchanged. Node tests do not close these gates. No release-ready claim.

## Cleanup and artifacts
Both original sources remain clean and exact:
- harem-nov13-maintenance HEAD f46fe8d8112c358738822ef2a9d488cefb27c35e / tree25de6ca71e2438354a6d058056329fcbb8494e61.
- harem-oct23 HEAD98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b / treec0c13d3e72e5eaa9c45f9533d65279b2c73ad15b.
Candidate tracked status clean; detached frozen head. Only ignored local artifacts/build/reused runtime copies remain. No servers or browser sessions started, both test processes completed. Existing tests own and clean their temporary fixtures.
Artifact folder: harem-nov13-maintenance/.scratch/nov14-pending/
Includes exact source tar, exact commit bytes, complete tree manifests for all inputs/result, both binary patches, raw identity deltas, complete per-path assertions, preservation summary, authenticated admission provenance, fresh aggregate/targeted logs and exits, build SHA256 list, cleanup status and SHA256SUMS. Git ancestry remains incomplete as disclosed above; source tar and full tree identities are complete.
