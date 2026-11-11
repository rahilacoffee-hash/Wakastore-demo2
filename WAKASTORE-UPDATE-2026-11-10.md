# WakaStore marketplace update — 10 November 2026

## Included
- Admin merchant moderation now includes approve, reject, suspend and remove actions. Removal records an audit entry, disables that merchant's products and revokes the demo merchant login.
- Merchant product management now supports add, edit (name, price, stock), restock and delete.
- Added dedicated merchant Inventory, Fulfillment and Earnings screens with live calculations from the shared demo state.
- Merchant fulfillment can accept, pack, dispatch and mark orders delivered.
- Rejecting a pending merchant sub-order invokes SmartFixer demo rerouting: restore rejected stock, find the cheapest approved alternate merchant with sufficient stock, reserve replacement stock, create reassigned sub-orders, notify the customer, and create a sourcing case when no alternative is available.
- Customer order detail now displays per-merchant fulfilment and reassignment status alongside the receipt.
- Responsive navigation breakpoints ensure the sidebar is used on desktop and bottom navigation on tablet/mobile, not both simultaneously.
- Existing customer cart, checkout, receipt and order detail routes remain in place.

## Demo-only limitations
- Data persists in browser localStorage; this is not multi-device or production server persistence.
- Payment and settlement are simulations. Earnings are estimates; no real payout occurs.
- Merchant rerouting is a local demo workflow, not a live logistics/SmartFixer API integration.
- Production requires backend authorization, transactional inventory reservations, payment verification, delivery provider integration and audit logging on the server.

## Verification
- `scripts/test-matching.mjs`: passed.
- `scripts/test-engine.mjs`: 33/33 passed.
- `scripts/test-accounts.mjs`: passed.
- Changed JSX files passed TypeScript transpiler syntax checks.
- Full Vite production build could not be run in this environment because dependency installation timed out and the available archived node_modules was incomplete. Run `npm ci && npm run build` locally before deployment.
- Removed merchant accounts can no longer fall through to the default demo merchant session; missing merchant records are redirected out of the merchant workspace.
