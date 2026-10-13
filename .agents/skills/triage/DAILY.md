# Daily pass

- Close issues the human said no to.
- Set `backlog` on anything open with no activity for `staleDays` (30
  if unset), except `p0` and `p1`.
- Cool hot priorities. A `p0` that isn't live breakage, data loss or a
  blocked client drops to `p1`, and so on down. A `Regression of #<PR>`
  stays `p1` or above.
- Add **In plain words** where it's missing, touching nothing else.
- Re-triage anything whose labels no longer match its body.
- **Worth a plan?** Look for three or more open issues from different
  sources on one feature. None may have a PR in flight or be `Part of` a
  plan already. Skip a group listed in an earlier **Worth a plan?**
  unless new issues joined it. For each group:
  1. Run `gh label create possible-plan --repo <owner>/<repo> --color D4C5F9 --description "These issues may need a plan." --force`.
  2. Label each issue `possible-plan`. Statuses stay.
  3. Add a **Worth a plan?** section to the log with the feature's plain
     name, why, and the issue links.

Log as `SKILL.md` says.
