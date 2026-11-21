# WakaStore — Final quotation prototype flow

**Prototype update:** 20 November 2026  
**Project basis:** Mr Manny's requirements, enhanced with the approved WakaStore workflow decisions.

This update changes the quotation marketplace flow while preserving the existing Direct Marketplace, customer Upload/Paste/Type request inputs, role dashboards, merchant onboarding application and standard product checkout.

## Approved quotation rules

1. **Matching:** Every approved and active merchant whose inventory covers at least 60% of the distinct requested material lines is invited. Inventory presence counts even when the item is out of stock; inventory coverage does not promise that the merchant has the quantity or can fulfil it.
2. **Offer presentation:** Merchants respond independently. WakaStore presents the two lowest-priced complete, unexpired quotations first. Other valid quotations remain available to inspect.
3. **Complete order:** The selected primary merchant is responsible for the entire materials list and full requested quantities. WakaStore does not automatically split the order among secondary suppliers.
4. **Merchant line responses:** Each requested line must be marked `Can be supplied`, `Can be sourced`, or `Cannot be sourced`.
   - `Can be supplied`: merchant provides the exact variation and unit price.
   - `Can be sourced`: merchant provides the exact variation, unit price and estimated sourcing time.
   - `Cannot be sourced`: merchant records that they cannot obtain the material. A merchant with any such line cannot submit a complete quotation.
5. **No partial quantities:** Every submitted offer must cover the full requested quantity for every line.
6. **Deadlines:** Merchant invitation response window is 24 hours. Each submitted quotation is valid for 48 hours from submission.
7. **Payment:** Customer pays through WakaStore. Payment verification is simulated in this frontend prototype. Funds are recorded as pending and are not shown as withdrawable until complete delivery and customer acceptance or an authorized admin resolution.
8. **Commission:** WakaStore commission is 5% of accepted materials value only. Delivery charges are excluded. The customer is not charged an additional 5% line item. Merchant receives 95% of accepted materials value plus merchant delivery charges where applicable.
9. **Customer acceptance:** Customer accepts the complete delivery, not individual portions. If the customer does not confirm acceptance, funds remain pending and an administrator must contact the customer, review delivery evidence and resolve the case. No automatic release by timeout.
10. **Delivery:** Support merchant delivery, customer collection and WakaRider where available. Customer collection has no merchant delivery charge in the prototype.
11. **Product type clarification:** Broad terms such as Pipe, Cable, Rod, Timber and Board show product types represented in merchant inventory. Both in-stock and out-of-stock records are included; duplicate types are grouped. The customer chooses the type, not the technical variation.

## Customer flow

1. Customer creates a request using Upload, Paste or Type in.
2. Customer reviews and confirms extracted material lines.
3. Broad ambiguous material terms display registered product types for selection.
4. Customer submits the complete request.
5. WakaStore invites all merchants meeting the 60% inventory-coverage threshold.
6. Customer can see invited merchants and submitted complete quotations.
7. The two lowest-priced valid complete quotations appear first; other valid offers remain accessible.
8. Customer selects one primary merchant quotation.
9. Merchant confirms the complete order.
10. Customer selects merchant delivery, customer collection or WakaRider where available.
11. Customer approves and simulates payment.
12. Payment is marked verified; funds remain pending settlement.
13. Merchant fulfils the complete order.
14. Customer accepts the complete delivery.
15. Settlement is allocated: 95% of materials value to merchant, 5% of materials value to WakaStore; delivery is excluded from commission.
16. If customer acceptance is not received, an admin review is required before settlement.

## Merchant flow

1. Merchant receives every request for which it qualifies under the 60% rule.
2. Merchant responds to every requested line with one of the three explicit statuses.
3. Merchant enters the exact variation and unit price for every line it can supply or source.
4. For sourced lines, merchant also enters an estimated sourcing time.
5. Merchant must quote the full requested quantity for every line.
6. If any line is marked Cannot be sourced, the merchant cannot submit a complete quotation.
7. Merchant enters delivery charge, fulfilment estimate and optional notes.
8. Merchant submits the complete quotation within 24 hours.
9. Submitted quotation remains valid for 48 hours.
10. If selected, merchant confirms the complete order.
11. Merchant fulfils the complete order and updates order status.

## Admin flow

- Review quotation requests with no eligible merchant.
- Monitor invitation and offer deadlines.
- Monitor paid quotation orders and pending settlement.
- Review delivered orders awaiting customer acceptance.
- Contact the customer and review delivery evidence.
- Explicitly record investigation or authorize settlement after review.
- Record administrative actions in audit logs.

## Prototype limitations

This remains a frontend/local-browser demonstration. Data is stored in browser state/localStorage. It does not implement a production backend, multi-device real-time synchronization, live OCR/AI provider, live WhatsApp Business integration, live payment gateway, regulated escrow/custody, real WakaRider dispatch, actual payout or production-grade admin evidence review. Payment and settlement statuses are simulated. A compliant payment provider and custody/settlement arrangement must be selected before production launch.
