# WakaStore — frontend prototype: audit and status (14 Nov 2026)

**Frontend only.** React + Vite + Tailwind v4, JavaScript, `AppStateContext` + localStorage + mock data.
No backend, no database, no real payments, no real AI, no secrets in the browser.

## What the audit found in the zip you uploaded (`Wakastore-demo_2.zip`)
It had drifted from `Wakastore-demo6.zip`, which your brief names as the base:
- `QuotationFlow.jsx` was back on the OLD single-page "Build your materials list" screen, so the three-pathway builder (Upload / Paste / Type in + shared review) was orphaned. **Re-linked.**
- Shopper categories had been changed to the same 30 as merchants (`shopper = merchant = 30` in `test-categories.mjs`). Your brief says two systems (12 customer-facing + 30 merchant, each merchant category mapped to exactly one customer category). **Restored the 12 + mapping**, kept your legacy-name migration and "2+ sellable products per merchant category" check. If you actually want shoppers to see 30, replace `src/constants/marketCategories.js` and the first block of `scripts/test-categories.mjs`.
- `src/data/categoryProducts.js`, `scripts/test-merchant-demo.mjs`, `merchantIdOf` auto-approve demo logic: kept untouched.
- Unavailable materials were silently dropped ("It won't be in this order") and a merchant rejection rerouted the WHOLE sub-order. Both contradict the new amendment. **Fixed (below).**
- `scripts/smoke-render.mjs` still targets the unused legacy stack (9/57 failures, pre-existing). **Not yet migrated to the live app** (`smoke-customer.mjs`, `smoke-integration.mjs` and the two e2e scripts cover the live app instead).

## Bugs fixed
1. **Search/matching:** "Cement 20" returned nothing while "Cement 20kg" worked, because `20` was compared with `20kg` as whole words. New reusable engine `src/services/productSearch.js` (case/space/punctuation/word-order/plural/alias/prefix; specs parsed as value+unit; bare number = *suggestion*, never an automatic match; Cement 20kg is never turned into 50kg; exact above partial; different sizes reported separately; "not in catalogue" becomes a custom material request). Used by Explore, the manual pathway, review-screen "Did you mean…", the quotation matcher and rerouting. `matching.js` lost its private token matcher (no duplicate logic).
2. **Unavailable items vanishing** from quotations/carts/orders.
3. **Whole-order rerouting** replaced by item-level rerouting.
4. Dead "Assign sourcing" button on the manual-sourcing page now works.
5. Cart/receipt/order table no longer show ₦0/NaN for unpriced lines ("Price pending").

## Business-logic amendment: unavailable materials, sourcing confirmation, item-level rerouting
Rules live in `src/services/sourcing.js` (pure, no React) and are applied through `AppStateContext` actions that take the actor from the signed-in session (not from arguments).
- Every requested line stays in the quotation, cart and order with name, specification, quantity and unit. No exact match / no stock => `SOURCING_REQUESTED` (or `AWAITING_MERCHANT` if no eligible merchant).
- **Initial matching is unchanged**: 60% of requested LINES, max two merchants, merchants below 60% do not qualify. Unavailable lines are assigned to the best-ranked *eligible* merchant whose categories fit. Rerouting never alters matching results (tested).
- Merchant order screen: unavailable items first, unticked checkbox "I can source this product." (unticked is never a confirmation); ticking reveals sourcing price (large field), timeframe, supplier notes, notes, "final price" confirmation; recorded with timestamp. "Cannot source this product" needs a confirmation step and reroutes ONLY that item.
- Rerouting: another approved merchant with a relevant category AND (matching in-stock product, spec-compatible, or `acceptsSourcing`), excluding anyone who declined, never the same item twice, original assignment kept in history. In-stock candidate => item becomes AVAILABLE with a price the customer must approve; sourcing-only candidate => `REROUTED` until THEY confirm. Nobody eligible => `UNRESOLVED` + Super Admin manual-sourcing queue. Nothing is ever claimed as sourced without a merchant confirming.
- Price changes: first price or an increase needs customer approval (not in the payable total until approved; decreases auto-apply); declining leaves the item unresolved and uncharged; previous price kept in history.
- Customer order page ("Your materials, item by item"): supplier per item, "Rerouted from X", ETA, status, approve/decline price, per-item fulfilment, accept / report a problem, history. One order, multiple merchants.
- Money (simulation): 95/5 split per item to the supplying merchant only, settled when the customer accepts that item; an open problem holds just that item's amount.
- Role checks: merchants only act on items currently assigned to them; customers decide prices/accept/report; only Admin/Super Admin resolve disputes; only Super Admin opens `/admin/sourcing`.

## 17-phase checklist (actual status)
| # | Phase | Status |
|---|---|---|
| 1 | Audit | Done |
| 2 | State cleanup | Partial: one live state (`AppStateContext`); legacy unrouted stack still present |
| 3 | Design system | Customer + new screens follow the palette; dashboards not audited |
| 4 | Three submission pathways + review | Done (re-linked, tested) |
| 5 | AI extraction demo | Simulated (upload = labelled sample; paste = local parser) |
| 6 | Merchant catalogue (fixed / price on request, images) | Not started this round |
| 7 | Matching demonstration | Engine + tests exist (60%, max 2); no dedicated "why qualified" UI yet |
| 8 | Merchant quotation workspace (merchant-entered prices) | **Not started** |
| 9 | Alternative sourcing | Done for ORDERS (confirmation, price, ETA, notes, reroute); the pre-order quote-time version is not built |
| 10 | Customer quotation comparison (2 quotes) | Not started (existing per-line selection remains) |
| 11 | Order journey | Partial: item-level fulfilment, approval, acceptance, report problem; no fulfilment-method picker (pickup / Fixer / WakaRider) |
| 12 | Wallet 95/5 | Partial: per-item allocation + holds shown on orders; no wallet ledger page |
| 13 | Merchant dashboard completion | Partial (orders done; analytics/profile gaps remain) |
| 14 | Admin completion | Partial (manual sourcing assignment added) |
| 15 | Separate Super Admin | Not started (Super Admin still reuses admin screens; only `/admin/sourcing` is Super-Admin-only) |
| 16 | Responsive QA | jsdom only. **No real-device or browser testing was done** |
| 17 | Regression | All scripts below pass |

## Files
Created: `src/services/productSearch.js`, `src/services/sourcing.js`, `src/pages/client/OrderItems.jsx`, `src/pages/MerchantOrderItems.jsx`, `scripts/test-product-search.mjs`, `scripts/test-sourcing.mjs`, `scripts/e2e-sourcing-flow.mjs`.
Changed: `src/context/AppStateContext.jsx` (items on orders, `quoteToCart`, 9 item actions, hydration upgrade, createOrder), `src/services/matching.js`, `src/pages/client/{Explore,QuotationFlow,Commerce}.jsx`, `src/pages/client/materials/{ReviewList,ManualPathway,MaterialListBuilder}.jsx`, `src/pages/client/Home/Home.jsx`, `src/pages/RoleDemo.jsx` (MerchantOrders, SuperAdminSourcing), `src/components/ui/ProductTile.jsx`, `src/constants/marketCategories.js`, `src/data/quoteSeed.js` (demo merchants default `acceptsSourcing`), `scripts/test-categories.mjs`, `scripts/smoke-integration.mjs`, `package.json`.
Removed: the private token matcher in `matching.js`; the old inline `NewQuotationFlow`.

## Commands
`npm install` · `npm run dev` · `npm run build`
Tests: `npm run test:search` · `npm run test:sourcing` · `npm run test:sourcing-e2e` · `npm run test:materials` · `npm run test:e2e` · `npm run test:customer` · `node scripts/test-categories.mjs` · `test-matching` · `test-mvp-matching` · `test-quote-units` · `test-merchant-demo` · `test-engine` · `test-accounts` · `test-state-hydration` · `smoke-integration`
