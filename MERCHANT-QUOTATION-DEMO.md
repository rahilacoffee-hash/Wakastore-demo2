# WakaStore quotation prototype

The current quotation flow is documented in `FINAL-PROTOTYPE-NEW-FLOW.md`. This replaces the earlier 18 November quotation prototype description where they conflict.

## Customer quotation journey

1. Sign in as a customer and open **Quotations**.
2. Create a request using **Upload**, **Paste**, or **Type in**.
3. Review the extracted materials, quantities, units and delivery location.
4. For broad material terms such as Pipe or Cable, select a product type represented in merchant inventory. Both in-stock and out-of-stock inventory records are included.
5. Submit the request. Every approved merchant with at least 60% inventory coverage of distinct requested lines is invited.
6. Review submitted complete quotations. The two lowest-priced valid offers are shown first; other valid offers can also be inspected.
7. Select one primary merchant. That merchant is responsible for sourcing and supplying the complete materials list.
8. After the merchant confirms, select merchant delivery, customer collection or WakaRider where available.
9. Approve and use **Pay securely (demo)**. The order is created with payment verified and funds pending settlement.
10. After the complete order is delivered, confirm acceptance. If you do not confirm, WakaStore admin must review the case before funds can be released.

## Merchant quotation journey

1. Sign in with an eligible merchant demo account.
2. Open **Quotation Requests** (`/merchant/quotations`).
3. Every request matched to the merchant using the 60% inventory-coverage rule appears in the workspace.
4. For every requested line, select:
   - **Can be supplied**
   - **Can be sourced**
   - **Cannot be sourced**
5. For Can be supplied and Can be sourced, enter the exact variation and unit price. For Can be sourced, also enter the estimated sourcing time.
6. Quote the full requested quantity on every line. Partial quantities are not accepted.
7. A quotation with any Cannot be sourced line cannot be submitted as a complete offer.
8. Enter delivery charge, fulfilment estimate and optional notes.
9. Submit within the 24-hour response window. Each submitted quotation is valid for 48 hours.
10. If selected, confirm the complete order and fulfil it through the merchant dashboard.

## Demo accounts

Use password `waka123`:
- Customer: `customer1@waka.test`
- Merchant: `merchant@waka.test` (BuildRight Supplies)
- Merchant: `powerhouse@waka.test` (PowerHouse Electrical)
- Merchant: `colourcraft@waka.test` (ColourCraft Store)

## What remains unchanged

- Existing product browsing, product details, storefronts, cart, standard checkout, wallet, standard orders and merchant product management remain available.
- Quotation procurement is an additional purchasing path, not a replacement for direct marketplace purchases.
- The standalone Merchant Onboarding System is not modified.

## Prototype boundaries

Data is local to the browser. There is no production API, shared real-time chat, live payment gateway, actual escrow/custody, real WakaRider dispatch or production payout. WhatsApp opens an ordinary WhatsApp chat link; it does not synchronize messages back into WakaStore. In-app messages are locally simulated. Payment and settlement are simulations only.
