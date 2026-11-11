# WakaStore audit and rebuild status — 11 Nov 2026

## Architecture found
- Frontend-only React 19 + Vite + Tailwind v4 prototype. No backend, no database, no real payments. State lives in browser localStorage.
- TWO parallel state stacks:
  1. Routed app: `context/AppStateContext.jsx` + `pages/client/*` + `pages/RoleDemo.jsx` (this is what users see).
  2. Legacy/unrouted: `context/StoreContext.jsx` + `services/engine.js` + `pages/Client|Merchant|Admin|Login.jsx` + `components/ui.jsx`. The tested business logic (checkout, refunds, 5-working-day resubmission, audit) lives here and is NOT used by the routed app. `scripts/smoke-render.mjs` also targets this legacy stack (48/57, unchanged by this work).

## Bugs found and fixed
- Explore category pills used the 30 merchant-taxonomy names but products use the 12 marketplace names, so category filtering returned nothing. Now one canonical list of the 12 exact categories (`constants/marketCategories.js`).
- Product detail looked products up by name and silently fell back to the first product. Now looks up by id and shows "Product not found".
- `/client/notifications` was a placeholder. Now a working notification centre (mark read / mark all read).
- Brand red was `#e94354` in CSS variables; now `#ED0018`.
- Mobile Home was the desktop hero squeezed down; landscape photos were cropped into portrait screens.

## Done in this pass
Customer Home (search + category strip first (shows 12 of the 30 official categories; full list on /client/categories), photo hero lower), Explore (search, category, merchant, price, availability, sort, loading + empty states), product detail (specs, merchant link, qty, add to cart, buy now, save, related), merchant storefronts (`/client/store/:id`), Account (profile, addresses, saved products, settings, logout), notification centre, bottom nav Home/Explore/Orders/Wallet/Account, mobile onboarding.
Tests: `npm run build` passes; `test-state-hydration`, `test-matching`, `test-engine` (33/33), `test-accounts`, `smoke-integration` (38/38) pass; new `npm run test:customer` renders 16 customer routes (16/16).

## NOT done yet (needs further passes)
- Merchant-side quotation response (unit prices, quantities, alternatives, delivery charge) — not present in routed app.
- Merchant / Admin / Super Admin dashboard redesign, merchant notifications page, Super Admin pages (admin management, permissions, settings, financial oversight), complaints.
- Wiring the routed app to the tested `engine.js` rules, or deleting the legacy stack.
- Wallet funding / withdrawal screens, refund-request UI audit, receipts audit.
- Real-device and browser testing (no browser was available here): overflow, safe areas, iOS/Android differences are unverified.
