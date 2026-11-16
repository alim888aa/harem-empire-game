# November 16 bounded unused-rule source cleanup

## Frozen source

- Local head: c322779a03db0fa62b16095aa45bb178fdad0263
- Tree: 06dc6e0323671c8bac3624e2ba6b37e4225846ae
- Sole parent: 9d17a41cc47af78b93210dfb0899d53c0e015ea8
- Base tree: c6d3c1107abd4cf81baffa2590ba4a57c26fd5e3
- Clean tracked status, 621 tracked paths; no source edits after freeze.
- Four changed files only; 2 insertions, 168 deletions. Full binary patch and raw commit are included.

Removed only handlePromotion, calculateAmbitiousMessageEffects and calculateFactionEffects, their JSDoc, PlayerStats's exclusively dead type import and the exclusively dead FactionType import specifier. Removed only those three names from the architecture backlog. Retained all other operations, types (including ambitious_faction), function bodies and JSDoc. No tests, dependencies, configuration, CSS, JSX, ledger, archive, schema, saves, events, RNG or runtime behavior were edited. Source file line counts fell 95→59, 203→136 and 287→224; architecture README remains 85 lines. No oversized touched file grew and new artifact helpers are each below 300 lines.

## Exact materialization and provenance

Authenticated GitHub connector GETs supplied actual issue28/spec/comment, recursive current-main tree and raw Git-data commit metadata. All 694 recursive entries, all 621 blobs, modes, subtree hashes and root hash were verified. Six missing blobs were fetched through that connector and Git-SHA checked; remaining source objects were reused by SHA from the existing isolated Git database copy, not a stale tree replacement. The actual raw base commit was reconstructed with its original author/committer metadata, +0800 timezone and no final message newline; its SHA matches exactly. The base parent metadata is retained but full ancestry is not claimed. The copied database is shallow and the reconstructed current tip is an explicit shallow boundary. Full remote tree, commit evidence and every base blob digest are included.

Current AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, worker skill and factory READINESS were read. These instruction files and package-lock.json are byte-identical to the inspected Nov15 checkout. Issue28 remains open and expressly permits small pure-hygiene slices. Its one migration comment adds no product decision.

Actual Node is v24.22.1. The committed lock is unchanged; 107 present installed package versions were matched against it (platform-inapplicable optional packages need not exist). Existing node_modules was reused through a local symlink, with no install. All 131 existing pinned asset lengths and SHA256 values were freshly verified before reuse; copies were made only into this new checkout. Asset CLI independently reports 131 verified, zero downloaded. Baseline and final build pruning each exclude 129 hosted binaries.

## Unreachability and live-code preservation

Fresh TypeScript AST audit scanned 187 tracked code files across application, tests, scripts, configuration and vendored factory code, excluding the forbidden-to-read dead old_code prototype. Each exact target identifier appears only as its function declaration. No target identifier/string lookup appears elsewhere. All 27 consumers of the three target modules resolve to explicit named imports of retained operations/types; no namespace/default module exposure, re-export or dynamic target import exists. The 15 dynamic import/evaluation inventory entries are non-production tests/factory code and none load a target module dynamically. Production has no dynamic import, eval, Function constructor or import.meta.glob loader. Targets have no initialization call, registration or global assignment. This is a private browser ESM application, not a published external SDK.

The full AST/import/dynamic inventory is in unreachability.json. Retained statement comparison verifies every remaining non-import statement/type/body/JSDoc byte-for-byte, excluding leading inter-statement whitespace only. Shared live fear application, faction assignment/offers/membership and cross-character spit/loyal application/notification remain untouched. The import edits are only the two now-unused type dependencies. No new source-regex/Markdown tests or test hooks were added; these scripts are ignored one-time audit artifacts, not application tests.

## Fresh executed results on the frozen final source

- PASS: pre-deletion production build on exact current main, exit0; baseline-build.log.
- PASS: final npm run factory:check, exit0; factory-check.log.
- PASS within aggregate: selected hygiene ratchet (unchanged baseline), all25 factory policy/contract tests, src-only TypeScript check, all497 main application/CLI tests, 131asset pin hashes/zero downloads, production build/prune129.
- PASS: existing focused public-interface subset, 83tests/zero failures, exit0: gameMachine, hateRules, influenceTuning, campaignStanding, courtStrategy and campaignSaveMigration. These83 are a subset of497, not extra unique coverage.
- PASS: complete production payload comparison, exit0. All285 paths and 23,847,739bytes match exactly, including JS, CSS, fonts, metadata and HTML. No filename changes, HTML reference changes or unexplained differences. JS assets/index-Cpi_IKoM.js and CSS assets/index-ogLC6n1w.css are byte-identical. Inventories include SHA256/length for every file.
- PASS: exact frozen head/tree/sole-parent/all621 tracked bytes and modes/clean status, plus git diff --check.

Existing Vite >500kB chunk warning and npm unknown http-proxy config warning remain visible. Selected hygiene is not full ESLint/dead-export completeness; TypeScript covers src only, not scripts/tests. No suppression, raised baseline or weakened test was introduced.

## Failed attempts, blocked and never-run work

No policy/write operation was denied. Scoped ordinary isolated source/Git/artifact/build writes passed supported permission review; no persistent permission/security change was requested.

A first oversized metadata serialization command failed to start with Argument list too long; evidence was subsequently saved in bounded chunks and independently verified. An initial checkout before missing tree reconstruction could not read the base tree; after exact object reconstruction, forced population of this new empty checkout restored its copied index correctly. A first blob decoder assumed an API envelope, but the connector supplies decoded UTF-8; no bytes were written by that failed decoder. Exact decoded content then passed the six expected blob hashes.

The initial one-time retained-statement audit failed only on leading blank lines left by removing the first import. Its raw failure log/exit1 are retained as retained-live-statements-initial.*. The audit was corrected to trim only leading inter-statement whitespace, then passed. No source changed to satisfy this artifact check and no product test failure was hidden. All actual baseline/final product checks passed.

NEVER RUN: full baseline aggregate (not needed for failure attribution), a new100-seed balance study, browser/headless/CUA/CDP/DevTools/alternate launcher, server, live metrics/session collection, Cloudflare reauthentication, downloads/installs, remote Git writes/ref changes, Site publication, public issue/PR comments or closure. No new jobs/agents/schedules or budget admissions were created.

## Remaining scope and preservation

This is only a three-export partial slice of issue28, not full issue acceptance, release or a visible improvement. Six backlog exports remain: consortHostility, careerWindow, graphBackers, getRank, hasPromotedOffice, getDisabledActions. Locked audience branches/labels, pending evaluating-message behavior, other issue28 acceptance and all unrelated backlog remain open. Earlier Nov15 toast/quest CSS/lighting cleanup remains intact; all CSS/JSX bytes are unchanged this slice. Independent exact-candidate review and parent decision are pending.

Original Nov15 checkout remains clean at5b66f2a02b46e9c2d31e633cadd07982d1222676/tree6754c4ca5906a053eb7dddd32b6db12b84583689; original98 remains clean at98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b. Existing old source proof/review folders and stale accounting checkout were not edited or cleaned. Missing historical Nov13/14 raw logs were not claimed rehashed. Latest pending runtime725a0fa51f58af28dadf216ea696216f286cda41 was not integrated or changed. Future integration must preserve it and current-main maintenance rather than overwrite either.

Existing public/active SiteV57/sourceabbf403ef771569533b802a88691696db4f0ce94 remains unchanged at the existing game site. No materially new browser-launch evidence exists; November12 socket/ptrace Operation not permitted exit133 remains unresolved and was not retried. All actual browser/hosted/replay/controls/gait/CSS/touch/roles/reduced-motion/H2/P0#41/#42 and parent release gates remain open. Source/build byte equivalence is not browser evidence or release approval.

The Nov16 ledger/archive were materialized exactly and never edited. The parent's existing USD20 reservation (source8/review5/allcoordination4/preservation3) and USD10 unallocated remain its accounting responsibility; no further admission is implied. Cleanup policy: retain this isolated checkout and owned ignored proof folder for preservation/review; no original input or old artifact was removed. SHA256SUMS covers all current proof files except itself, including baseline payload bytes, fresh logs, source evidence and this report.
