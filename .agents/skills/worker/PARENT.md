# Parent run

Runs on the plan's feature branch once every child is closed. The rest
of the worker skill still applies. A parent PR never uses `approved`.

1. Open the parent PR into `main` if it isn't open: `Part of #<plan>`,
   **In plain words** for the feature, and every child's **Proof** and
   **Assumptions**. Set `reviewer-ready`.
2. On each new head, run checks, walk the plan's flows with the
   `browser` skill (one **Proof** line each), and start review on code no
   review has cleared and the hunt.
3. Fix what they find on the feature branch and repeat 2. Anything too
   big to fix here gets its own issue with `Part of #<plan>`, and the
   parent goes `blocked`.
4. When everything is clear on the same head and checks are green, set
   `human-ready` and stop.
