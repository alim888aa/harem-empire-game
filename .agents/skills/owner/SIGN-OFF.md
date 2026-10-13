# Parent PR sign-off

1. Read the parent's **Proof**. Each `unproven` item is yours to OK or
   treat as a gap.
2. A browser subagent walks the plan's flows and the original ask on the
   parent's exact head. It returns what works, what's off, and
   screenshot links.
3. Run a council sign-off. The client angle answers "would they be happy
   with this?".
4. Happy: post the Owner decision and send the manager `merge #<n>`. Add
   `deploy <env>` if the project deploys through the factory.
5. Not happy: file one `type:bug` issue per gap with `Part of #<plan>`,
   and set the parent `blocked` on them.
