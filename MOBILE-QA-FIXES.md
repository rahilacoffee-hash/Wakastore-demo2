# WakaStore mobile QA fixes — 10 November 2026

## Fixed
- Hardened `AppStateContext` hydration so malformed or older localStorage values cannot make `notifications` (or other collection fields) non-iterable.
- Normalized wallet history and invalid session/toast values during hydration.
- Added a regression test that reproduces malformed saved notifications and confirms the provider hydrates safely.
- Made marketplace search, category filters, sort order, and clear-filters controls functional.
- Category directory cards now open the marketplace with the selected category pre-filtered.
- Increased mobile type hierarchy and control weight, added visible keyboard focus states, and reinforced touch target sizing.

## Verification run
- `npm run build` — passed.
- `node scripts/test-state-hydration.mjs` — passed.
- `node scripts/test-matching.mjs` — passed.
- `node scripts/test-engine.mjs` — 33/33 passed.
- `node scripts/test-accounts.mjs` — passed.
- `node scripts/smoke-integration.mjs` — 38/38 passed.

## Remaining verification
- Physical-device/browser interaction QA is still required at 360, 390, 430, 768, 1024, and 1440 px.
- Vite still reports a production JavaScript chunk above 500 kB; this is a performance advisory, not a build failure.
- Payment, wallet, and other explicitly demo-labelled flows remain simulated. This package is not evidence of live payment processing or live backend persistence.
