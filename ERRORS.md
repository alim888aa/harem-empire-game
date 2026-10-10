# Errors

## Current style
There is no unified error class hierarchy. Pure validation throws Error; persistence converts failures into typed SaveStatus/LoadedCampaign results, retains recoverable backups and surfaces an actionable message. Preserve those public interfaces. Do not invent a new error library or convert unrelated code during setup.

## Patterns
- Invalid/untrusted save: reject at parseCampaignSave, preserve the current campaign and recovery bytes, show a problem message.
- Browser storage unavailable/full: keep the in-memory campaign, mark storage unavailable, show that progress cannot persist. Never claim a save succeeded.
- Asset missing/hash mismatch: assets:verify fails; do not substitute unverified art or disable verification.
- Gameplay decision rejected: return the existing typed outcome/receipt to the owning UI. It is not a transport error.
- Unexpected runtime failure: stop only the affected operation, retain safe state, disclose the failed step. No empty-success catch.
- Factory environment/accounting unavailable: hold all dispatch, record the precise blocker, preserve work for retry. No p0 budget exemption.

## Alert channel
Persistence already uses its status interface. Campaign alert()/console.log behavior is legacy debt tracked by #6/#19 and remains unchanged by setup. The notices slice owns removing it. Console diagnostics are not a player notification channel. Never expose credentials or private save contents in logs.

## Rules
Validate external inputs at their boundary. Catch only where recovery or useful feedback is possible. A fallback needs a stated reason and must preserve failure visibility. Retry only idempotent operations; no arbitrary retry loops. New shared failures need an explicit typed result or error with its owner and a behavior test.
