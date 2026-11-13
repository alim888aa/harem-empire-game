# Campaign simulator report-output maintenance

## Result

Reproduced the exact main-source failure, repaired report output, and passed final aggregate checks. Local candidate commit `4b0113ce7294bcd73ba0b3342f71fef668fbc09e`, tree `fd390faf3c75f27db7d102fc17eb5496309b1e8a`, directly parents admission `18b91a25cc6c2b125dd621558dc015471c9e085a`, tree `d7d9e87f9320b4bdc037101552388dbebcbd71ab`.

## Changed files

- `.gitignore`: narrow default simulator JSON ignore pattern.
- `scripts/simulate-campaign.ts`: print real computed summaries before filesystem work; recursively create report parents; retain thrown write errors/nonzero exits. No wrapper or error-to-success catch.
- `tests/campaignSimulator.test.ts`: six real process/temp-directory public CLI tests, included by unchanged main `tests/*.test.ts` glob. Fixtures are removed with test cleanup. No source/Markdown regex tests, hooks or dependencies.
- `CAMPAIGN_BALANCE.md`: remove duplicated tuning tables and stale values, point to CAMPAIGN_BALANCE/Career/courtHierarchy owners, retain glossary and design rationale, standardize documented simulation command, explicitly mark earlier simulation/browser claims historical.

Complete patch: `candidate.diff`. No gameplay, UI, actor, encounter, save, schema or RNG code changed. Existing scripts/tests folders exceed the directory file-count guideline; this bounded CLI regression uses the existing public test glob rather than adding a forwarding module or broad structural cleanup. No touched file exceeds 300 lines.

## Actual verification

- Baseline on exact admission source: `ROLE_FILTER=prince POLICY_FILTER=bad node --import tsx scripts/simulate-campaign.ts 1 1 2` exited 1 with ENOENT at `validation/campaign-simulation.json`; stdout was empty. See `baseline.stderr` and `baseline.stdout`.
- Focused final CLI tests: `node --import tsx --test tests/campaignSimulator.test.ts`, exit 0, 6/6 passed. Default missing directory, default filename and seed suffix, nested relative/absolute override, write-to-directory error, blocked-parent error. Failure stdout is parsed and compared with the real deterministic successful run's summaries. See `focused.log`.
- Final exact candidate bytes: `npm run factory:check`, exit 0. Hygiene, 25 factory tests, typecheck, 497 game/CLI tests, production build and hosted-binary pruning passed. All 131 assets verified, 0 downloaded. See `factory-check.log`.
- `git diff --check` passed. Isolated candidate worktree clean after local commit. Pending checkout remains clean at `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b` / `c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b`.
- Build reports a large-chunk warning; it is a warning, not a failed gate. No npm update/install was performed. No configured lint command exists; hygiene is not full lint or test/script typechecking. Scripts/tests remain outside the repository's src-only TypeScript check.

## Never run / remaining boundaries

No new 100-seed balance study, browser launch, native controls/touch/CSS/temporal QA, remote writes, PR/issue communication, telemetry, publication or deployment. No full baseline factory run was needed because the final aggregate had no failures; the baseline defect was measured directly. Historical pending567 counts were not used as main-source results. Independent exact-candidate review and parent preservation/release decision remain outstanding. Issue #29 is not auto-closed. P0 #41/#42 and pending runtime integration gates remain open. Preserve this CLI maintenance when integrating pending runtime later. Existing public Site V57 is unchanged.

## Source provenance

See `materialization.json`, `admission.commit`, `admission-tree.txt`. Only the authenticated connector fetched missing blobs/metadata; each imported blob hash matched, the full tree hash matched, and reconstructed raw commit SHA matched admission. Admission's older parent is not present locally, so this is exact source materialization, not a claim of complete fetched history. Existing dependency records and assets were verified compatible before reuse. No asset downloads, installations or credential reads.

All artifacts in this report are in this isolated checkout's `.scratch/harem-nov13/`, not the shared workspace. `artifact-sha256.txt` records their hashes.
