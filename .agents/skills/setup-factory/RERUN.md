# Setup ran before

Remove `TEAM.md` and the old org skills.

## Labels

On every open issue and PR, swap the old labels, then delete them:

- `cloud-ready` → `agent-ready`
- `local-verification` and `verifier-ready` → `reviewer-ready`
- `urgent-candidate` → `p0`

Remove `building` from issues, or dispatch relaunches each one as a
crashed worker.

## Threads and schedules

Find the project's `Factory ·` threads and schedules before launching
anything, and add only what's missing. Two dispatch threads would both
hand out slots.

- Replace an hourly tick with the 10-minute one.
- Replace a manager-bound audit schedule with the audit registration.
- Delete the old `factory-wake` workflow in the setup PR, plus the
  `FACTORY_DISPATCH_URL` and `FACTORY_MANAGER_URL` repo secrets.
