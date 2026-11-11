# WakaStore mobile-first update

This update prioritizes the customer and role-based mobile experiences while preserving the existing React + Vite + JavaScript architecture.

## Main changes
- Rebuilt the customer overview homepage with a mobile-first construction marketplace layout, responsive hero/search, horizontal category rail, product tiles, quotation CTA, order/wallet shortcuts and trust section.
- Homepage featured products now read from shared application state so merchant inventory changes can flow through to the homepage.
- Added mobile top navigation, role-specific bottom tabs and a slide-up full navigation sheet for merchant/Admin workspaces; desktop sidebar navigation remains available.
- Added safe-area spacing, mobile viewport/overflow handling, touch-friendly surfaces and tablet sidebar spacing.
- Corrected the startup route to open the actual WakaStore welcome experience rather than the unrelated SmartFixer onboarding screen.

## Verification
- `npm run build` — passed (Vite reports a bundle-size advisory above 500 kB).
- `node scripts/test-matching.mjs` — passed.
- `node scripts/test-engine.mjs` — 33/33 passed.
- `node scripts/test-accounts.mjs` — passed.
- `node scripts/smoke-integration.mjs` — 38/38 passed.

## Run locally
```bash
npm install
npm run dev
```

The demo payment, wallet, and other prototype flows remain simulated as in the existing project.
