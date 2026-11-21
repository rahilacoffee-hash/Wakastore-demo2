# WakaStore prototype — completion round (20 November 2026)

Base: `Wakastore-final-prototype` (whole-order quotation flow). Everything below is a FRONTEND PROTOTYPE: browser state only,
payments / SMS / push / SmartFixer / WakaRider are simulated and labelled as such in the UI.

## Business decisions applied
- Commission = 5% of materials, deducted from the merchant. Never added to the customer's bill (cart, checkout, receipts, quotation payment).
  Delivery is excluded from commission. The rate is editable by Super Admin (`settings.feeRate`) and drives new orders and settlement splits.
- One merchant per order at launch (`settings.multiMerchant = false`). Item-level rerouting of cart orders is off; items a merchant cannot
  supply go to the admin queue.

## Added in this round
| Area | What it does | Where |
|---|---|---|
| Delivery picker + real fee | Merchant delivery / pickup / WakaRider at cart checkout; fee from a rate card by distance (same city / state / other), WakaRider not offered across states, extra charge per additional merchant stop | `services/delivery.js`, `Commerce.jsx` |
| Dispatch + proof of delivery | Merchant must record driver, phone, ETA (or pickup code); proof needs recipient + photo or note. Customer and admin see the record | `pages/DeliveryRecords.jsx` |
| Failed-payment states | Declined, insufficient funds, and provider timeout (unconfirmed). Idempotency key per checkout; unconfirmed blocks re-charging until admin reconciles | `attemptPayment`, `reconcilePayment`, `PaymentSimulator` |
| Bulk inventory upload | CSV and .xlsx, template download, row-level validation, preview, import valid rows | `BulkInventoryUpload.jsx`, `services/inventoryImport.js` |
| Merchant documents | 4 required documents, upload, admin verify / request correction (audit-logged) | `MerchantDocuments.jsx` |
| Super Admin dashboard | Separate `/super-admin/*` workspace: overview, admin accounts (temporary password, forced change, suspend, reset), editable settings (commission, threshold, windows, rate card, multi-merchant) | `SuperAdminPages.jsx`, `AdminLogin.jsx` |
| Notification delivery log | Every notification logged per channel (in-app, push, SMS fallback for important events) with failure reason and retry | `services/notificationLog.js`, admin page |
| Reports | KPIs, merchant ranking (response rate, speed, disputes), response times, category coverage | `services/reports.js`, `AdminPages.jsx` |
| Matching explainer | Per quotation: each merchant's coverage %, matched / missing lines, why excluded | `AdminQuotations` |
| SmartFixer handoff | Import approved job materials with quantities and specs; procurement status timeline; customer authorises the fixer to see status | `pages/client/SmartFixer.jsx` |
| Also fixed | Four admin sidebar pages that were placeholders; merchant Settlements was hardcoded (now a live ledger with withdrawals) | `AdminPages.jsx`, `RoleDemo.jsx` |

## Tests
`npm run test:launch-flow` (28 checks, browser-style), `test:ops-pages`, `test:ops`, `test:launch-rules`, plus all existing scripts.
Known, pre-existing in the uploaded final prototype (not caused by this round): `test:sourcing-e2e` asserts old per-item sourcing UI text;
`smoke-render` / `test:customer` / `test:integration` crash on the jspdf import under Node + jsdom (environment). Run them in a real browser session.

## Not built / out of scope for a prototype
Real payment gateway and escrow, real SMS/push, real OCR/AI, real SmartFixer API, real WakaRider dispatch, backend, multi-device sync.
Passwords and uploaded-document metadata live in browser storage: never use real credentials or documents.
