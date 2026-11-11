# WakaStore MVP — Product and Development Specification

**Status:** Product baseline for the next implementation phase  
**Concept:** Merchant-based building-materials sourcing and fulfilment integrated with SmartFixer.

## MVP outcome
A customer submits an approved materials list. WakaStore identifies two suitable merchants, obtains complete itemised quotations, lets the customer choose one, collects payment into the selected merchant's order-linked Store Wallet ledger, coordinates fulfilment, and settles only after customer acceptance.

## Customer journey
1. Submit materials by SmartFixer import, pasted list, photo upload, or manual entry.
2. Confirm quantities, units, specifications, delivery location and required date.
3. Receive two merchant offers where two qualified merchants exist.
4. Compare complete itemised price, stock/outsourced status, delivery/pickup cost and fulfilment estimate.
5. Select one merchant and one fulfilment method: customer pickup, Fixer pickup, or WakaRider delivery.
6. Pay and track order progress.
7. Inspect the materials and choose **Accept Order** or **Report a Problem**.

## Merchant matching rules
- Merchants must be approved, active, registered for relevant materials categories, and capable of supplying at least 60–70% of requested material lines (configurable threshold; default 60%).
- The percentage is based on requested line coverage, not order value.
- Select the two strongest eligible merchants. If fewer than two qualify, disclose that and send the request for additional sourcing; never invent an offer.
- Each selected merchant must quote the **entire** materials list. Mark every line as in-stock, partial-stock-plus-sourcing, or merchant-sourcing-required.
- A quotation is not customer-ready until the merchant supplies a price and fulfilment estimate for every line, including outsourced lines.
- Merchant category membership is a matching signal, not proof of actual stock or capacity. Stock and sourcing commitments must be confirmed by the merchant.

## Official merchant categories (30)
1. Cement Merchant
2. Sand Merchant
3. Chippings/Granite Merchant
4. Blocks Merchant
5. Iron Rods & Reinforcement Materials Merchant
6. Timber Merchant
7. Plywood & Board Merchant
8. Roofing Materials & Accessories Merchant
9. Electrical Materials Merchant
10. Lighting & Light Fittings Merchant
11. Plumbing Materials Merchant
12. Sanitary Ware Merchant
13. Tiles Merchant
14. Marble & Granite Merchant
15. Tile Adhesive & Grout Merchant
16. Paint Merchant
17. Screeding & Wall Finishes Materials Merchant
18. POP & Gypsum Materials Merchant
19. Ceiling Materials Merchant
20. Doors, Locks & Hardware Merchant
21. Aluminium Materials Merchant
22. Glass Merchant
23. Steel, Metal & Welding Materials Merchant
24. MDF & Furniture Board Merchant
25. Furniture Fittings & Accessories Merchant
26. Wallpaper & Wall Panel Merchant
27. Curtains & Blinds Merchant
28. General Hardware Merchant
29. Sealants, Silicone & Adhesives Merchant
30. Pest Control & Fumigation Supplies Merchant

Water Tank Merchant and Water Pump Merchant are excluded.

## Merchant workspace
- New materials requests and full specification list.
- Itemised complete-order quotation editor.
- Per-line in-stock / partial / outsourced flags.
- Confirm price, availability and fulfilment timeline.
- Source and prepare materials.
- Statuses: Processing → Ready → Dispatched (where delivery applies) → Completed / Awaiting customer acceptance.
- Store Wallet, order-linked pending balances and transaction history.

## Wallet, commission and settlement
- Customer payment is linked to the selected merchant and the specific order.
- Funds remain pending and unavailable for withdrawal until acceptance.
- On acceptance, settle 95% to the merchant and 5% as WakaStore commission.
- On dispute, place the affected amount on hold until an authorised resolution.
- Keep immutable ledger entries for payment, hold, release, commission, refund and adjustment.
- Do not treat a frontend balance as money. Payment verification, idempotency, ledger writes and settlement must be server-side.

## Fulfilment choices
- Customer Pickup: customer collects from the merchant.
- Fixer Pickup: assigned SmartFixer fixer collects for the job.
- WakaRider Delivery: merchant dispatches through WakaRider where available.

## Customer acceptance and disputes
Customer confirms quantities, specifications and condition. Acceptance triggers settlement. Reporting a problem records evidence, the affected line/amount, reason and dispute status; the affected funds remain held pending resolution.

## Admin and Super Admin
Manage merchant registration and category assignments; monitor matching, quotations, orders, payment ledger, commission, wallet holds, disputes and merchant performance. Record sensitive actions in an audit log with actor, timestamp and reason.

## Suggested core data entities
`users`, `merchants`, `merchant_categories`, `products`, `inventory`, `materials_requests`, `materials_request_items`, `merchant_matches`, `quotations`, `quotation_items`, `orders`, `order_items`, `fulfilments`, `wallet_accounts`, `wallet_ledger`, `payments`, `settlements`, `disputes`, `notifications`, `audit_logs`.

## Suggested API surface
- `POST /materials-requests` — create/import a materials request.
- `POST /materials-requests/:id/match` — run matching and return up to two qualified merchants.
- `GET /merchants/requests` — merchant request inbox.
- `POST /materials-requests/:id/quotations` — submit complete itemised quotation.
- `GET /materials-requests/:id/quotations` — customer comparison.
- `POST /quotations/:id/select` — choose merchant and create order.
- `POST /orders/:id/pay` — initialise payment.
- `POST /payments/webhook` — verify provider event and update ledger idempotently.
- `GET /orders/:id/tracking` — order/fulfilment status.
- `POST /orders/:id/accept` — accept and trigger settlement.
- `POST /orders/:id/disputes` — open dispute and hold affected funds.
- `POST /admin/disputes/:id/resolve` — authorised dispute resolution.

## Implementation guardrails
- Frontend is a demo client, not the authority for roles, stock, payment or wallet balances.
- Enforce merchant ownership and Admin/Super Admin permissions on the server.
- Use a transactional database operation for payment-to-ledger and acceptance-to-settlement transitions.
- Use idempotency keys for payment, webhook, acceptance and settlement operations.
- Never silently split the customer's chosen order across merchants; the MVP asks the customer to select one complete-order quotation.
- Clearly label simulated payment, wallet and delivery functions until live integrations are connected.
