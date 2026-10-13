---
name: browser
description: Drives the real app to prove or break a change, with screenshots and proof videos. Use when a job needs to walk a flow in the app.
---

# Browser

Use the app as a user would. Judge pass or fail from the screen only.

## Tools

Use the browser tools you have. With none, use Playwright in headless
Chromium.

`touch.mjs` in this folder does tap, swipe, reduced motion and phone
width when your tools can't. Run it from the PR's worktree; with no
arguments it lists its commands.

```sh
healthguard run --owner '<your T3 thread ID>' --provider <codex|claude> -- \
  node <this folder>/touch.mjs start --url <fixture URL> --viewport 390x844
```

## Every walk

- Save screenshots in `.scratch/<job>/`.
- Check 390x844 and 1440x900.
- Record anything that moves or takes several steps with
  `video-capture` (`record`, `review`, `publish`) and put the link on
  the proof line.
- Before you return, stop everything you started: `touch.mjs stop`,
  recordings, browsers, `localdev`. Leave the human's windows open.
