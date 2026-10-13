# The four docs

Review holds every PR to these. Keep existing ones and fill in missing
sections.

- `CODING_STANDARDS.md`: agent-org's `standards/CODING_STANDARDS.base.md`
  plus a short project section.
- `ERRORS.md`: `standards/ERRORS.base.md` plus the project's alert
  channel, errors module and extra patterns.
- `DESIGN.md`: the tokens, components and spacing most pages share. A
  monorepo gets one beside each UI app and a short root one linking
  them.
- `CONTEXT.md`: what the product does, who uses it, and the words the
  code uses for its things.
- **Realism** in `CONTEXT.md`: who uses it, how many, rough data and
  traffic, what's critical, and what basically can't happen.

Write `ERRORS.md` and `DESIGN.md` from what most of the code does, and
list the exceptions. With no consistent pattern, propose common good
practice instead of copying one file. Mark every guess.

A dark project's `CONTEXT.md` also gets the sections in
[DARK.md](DARK.md).
