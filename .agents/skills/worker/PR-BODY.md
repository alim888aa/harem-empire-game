# PR body

Other jobs read these headings, so keep them exact. Leave out sections
that don't apply.

```
Author: worker · <run id>
Closes #<issue>
Part of #<plan>

## In plain words
<two or three sentences for the human>
## What
<what changed and why>
## Behaviour the human approved
> Human decision, verbatim: "..."
## Reviewers
<both | review | hunt | neither> — <one-line why, for the current head>
## Proof
- [x] <acceptance item> — <video | screenshots | test | command → output> · <the real case>
- [ ] <acceptance item> — unproven: <why>
## Assumptions
- <one line per guess, or "none">
## Base failures
- #<n> <the check that fails on the base too>
```
