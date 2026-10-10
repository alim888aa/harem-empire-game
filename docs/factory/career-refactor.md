# Career refactor

Issue: https://github.com/alim888aa/harem-empire-game/issues/33 . Setup base: PR #32 at bd0d064e.

## Boundary choice
Considered replacing saved/actor career fields with a normalized object, versus keeping legacy inputs at a deep module boundary. Chose the latter to preserve all event/save/import contracts. The public entrypoint hides normalization, tuning, access, deadlines, progression, notices/standing, income and office identity. Internal files own distinct concerns and stay below 300 lines.

## Compatibility
Runtime consumers import the new front door. Historical imports re-export identical functions/constants only; tests prove identity and old behavior. They remain because existing tests/scripts and potential external consumers rely on them. No duplicate or fallback rule path exists. Relationship-specific endorsement renewal and court rivalry stay outside Career.

## Evidence
The purpose-named tests/career folder owns the new test and generated fixture; npm test explicitly discovers both existing root tests and this folder, without increasing direct root-file debt. Golden public-operation outputs captured from the pre-refactor main66ab9cb cover 6 role identities ×12 rank inputs, all 6 zones, deadline ages, probation, threshold epsilon, consolidation, money, offices and notices. Four new interface tests validate those outputs, import compatibility and intentional demotion distinctions.

The existing seeded simulator ran 36 campaigns (3 seeds ×3 roles ×4 policies) to a 30-season horizon before and after. Full 737603-byte reports are identical; no output fields were excluded. Hashes and exact command are in career-replay.json. Current source/schema/RNG algorithms and UI markup were not changed; caller edits are imports only. Existing save tests cover migration/recovery and actors.

## Known limits
This is not a full machine/UI architecture rewrite. Aggregate source hygiene does not prove per-file lint or dead-export completeness. Independent review and exact-head verification are pending; no live browser result is claimed. No publication or gameplay feature change is included.
