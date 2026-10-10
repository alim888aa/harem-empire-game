# Runtime asset delivery

The V55 runtime's 118 GLBs and 11 material images are stored byte-for-byte in the
`empire-game` Cloudflare R2 bucket rather than in the Git tip. Material attribution
and sources metadata are also mirrored there; their originals, all model provenance,
release notes and portraits remain in Git. Historical Git commits still contain
their historical binary versions; no repository history was rewritten.

Public base: https://pub-79c7cda7fb524f4fab929b74d14c5f1f.r2.dev

`runtime-assets.json` is the recovery inventory. It pins the original relative path,
object key, byte count and SHA-256 for all 131 uploaded files. Do not change a pinned
checksum without verifying the intended authored release. No art was recompressed,
decimated or otherwise changed for this move.

## Development and tests

```sh
npm ci
npm run assets:fetch
npm run assets:verify
npm run check
npm run build
```

The fetch command needs no credentials. It downloads missing or mismatched files
from the public base, verifies byte count and SHA-256 before installing each file,
and reuses valid local copies. A failed HTTP response or checksum mismatch stops
with an actionable error; a partial download never replaces a working file.
The full tests use these local files and begin with a checksum verification.

The game uses hosted art by default, including during local development. The shared
delivery resolver operates only at model fetching/decoding and material texture
loading boundaries. Logical model identities, query-string cache keys, palette and
depth repairs, source caches, lease ownership and existing failure fallbacks are
unchanged. Model provenance and other application URLs stay local.

For explicit offline development after fetching all assets:

```sh
VITE_RUNTIME_ASSET_BASE_URL=local npm run dev
```

An alternative already-configured HTTP(S) asset base can also be selected using
`VITE_RUNTIME_ASSET_BASE_URL`; it must serve the same `/models/...` and
`/materials/...` keys with appropriate CORS. This is a build-time setting.

`npm run build` strips only the 129 externally hosted binary copies from `dist`,
even when local test assets have been fetched. Metadata and attribution remain.
Production builds therefore require the hosted asset origin; offline mode is for
the dev server, not a self-contained production build.

## Access, CORS and hosting limits

The bucket permits public reads. Its GET/HEAD CORS configuration allows the existing
game origin `https://harem-empire-3d-development.alimar55555.chatgpt.site` and local
development origins on `localhost` and `127.0.0.1` ports 5173 and 4173. Texture
requests use anonymous cross-origin loading; no credentials are sent.

The `r2.dev` endpoint is development-oriented and rate-limited. This update does
not configure a custom domain, promise production CDN capacity, or create any new
paid service. Changing the application origin may require a separately authorized
CORS update. Public asset URLs must not contain private data or secrets.

## Verification for the 2026-10-10 sync

- All 131 source SHA-256 hashes were checked before upload; stored object sizes
  and MD5 ETags matched, with zero mismatches
- All 131 local files pass the pinned SHA-256 recovery verification
- Typecheck, all 480 tests (471 existing and nine delivery/recovery tests), and
  production build pass; the pre-existing large-JavaScript-bundle warning remains
- A normal cloud Chrome session retrieved and decoded a hosted material image at
  1024 by 1024 pixels
- End-to-end cross-origin browser GLTF loading and CORS are not verified: the cloud
  browser cannot reach the executor's localhost, and executor Chromium cannot
  launch because its process socket is blocked by the environment
- A Python public request received Cloudflare error 1010; normal Chrome retrieval
  succeeded. Scripted downloads can be affected by client/network restrictions

No public game deployment is performed by this repository sync. The currently
published game continues using its existing asset delivery until a later authorized
deployment.
