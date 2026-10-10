# Court menus and notifications repair

## Changes
- Replaced the auto-height flex dialog path that could collapse to a heading-height strip in Safari. Shared dialogs now use intrinsic grid sizing, a fixed title/44px close control, and one keyboard-accessible scrolling body bounded to the dynamic viewport.
- Migrated shared dialog and conversation/imperial variant sizing out of legacy CSS into the theme. Kept the scroll rods and opening animation, native focus containment, Escape, backdrop dismissal, focus return, and reduced-motion behavior.
- Removed the central assassination/casualty banners. Notifications now show active warnings first, with attackers, targets, exact next-attempt seasons, safety thresholds and available defenses. The Notifications control retains an urgency emblem while any plot remains active, even after reading it.
- Added court outcome history to the inbox, including casualties, methods, targets, and defused plots. Gift receipts remain available. The existing court intrigue report and season recap remain intact.
- Stable read receipts persist in campaign saves. Continuing next-season attempts and newly committed outcomes become unread; rerenders and reloads do not duplicate them. Reading never settles a season, advances RNG, spends gifts, or changes plot balance.
- Corrected a flaky existing casualty test fixture so changing its influence retains its prior graph faction. Assertions and production faction rules are unchanged.

## Verification
- TypeScript typecheck passed.
- All 436 automated tests passed, including 10 new notification/dialog interface regressions.
- Production build passed; existing bundle-size warning remains.
- Source review confirms all old center-banner styles/markup are removed, and the theme owns dialog sizing.
- Browser QA was attempted through the supported portable preview flow. The preview server starts, but same-context readiness fails before execution with a sandbox runtime error; the default context cannot reach the server. Browser and iPad/Safari visual validation therefore remain unverified, rather than being reported as passed.
- All existing deployed character models, portraits, animations, textures and other art are preserved byte-for-byte. This release changes the HTML entry and application JS/CSS only.
