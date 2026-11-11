# WakaStores mobile refresh

## What changed
- Reworked the client home hero for phones: removed the oversized fixed-height mobile banner, tightened headline and search spacing, and kept the primary action prominent.
- Changed the mobile category area from narrow horizontal tiles to a readable two-column grid; tablet and desktop grids remain responsive.
- Simplified the customer bottom navigation to the five primary destinations already defined in the app navigation config; logout is no longer a sixth competing tab.
- Preserved WakaStores red, blush, white, charcoal and neutral surfaces.
- Rebuilt the production `dist` output.

## Verification
- `node node_modules/vite/bin/vite.js build` — passed.
- `node scripts/smoke-integration.mjs` — 38/38 passed.
- The legacy `smoke-render.mjs` script reports pre-existing route/guard failures and stale paths; it is not a clean validation of this refresh.
