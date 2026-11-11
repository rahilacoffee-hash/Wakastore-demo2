# WakaStore commerce and logout update

## Included
- Quotation matching lines can be sorted by material name, unit, or lowest available unit price.
- Merchant quote options show product thumbnails, merchant, product reference, unit price, availability and line total.
- Converting a quotation carries selected product references and quantities into the cart and then checkout.
- Checkout now requires recipient, phone, street, city and state before an order can be placed; landmark and delivery instructions are optional.
- Order snapshots store item references, unit prices, line totals, materials subtotal, 2.5% WakaStore fee, delivery fee, payment method and delivery address.
- Each new order receives a unique order ID and receipt ID.
- Order confirmation displays an itemized receipt with product references, prices, fees and total; it supports HTML receipt download, print/save as PDF, and native share or clipboard fallback.
- Customer logout is wired in the desktop sidebar and mobile bottom navigation. Role workspace logout also returns to the welcome screen.
- Wallet checkout checks available balance before placing an order.

## Demo limitations
- Card and bank transfer remain simulated; this build does not collect live payment.
- Delivery fee is a fixed demo amount of ₦3,500 and should be replaced by a real location/merchant-based quote before production.
- HTML receipt download can be opened in a browser and printed/saved as PDF. Native share depends on browser/device support.

## Admin login update
- Added a dedicated `/admin/login` screen with email/password validation, password visibility toggle, and role-aware admin/super-admin sessions.
- Added an Admin portal entry on the welcome screen.
- Unauthenticated visits to `/admin/*` now redirect to `/admin/login`.
- Demo credentials: `admin@waka.test` / `waka123`; `superadmin@waka.test` / `waka123`.
- Security note: this prototype validates demo credentials in the frontend only. Production must authenticate against a backend, hash passwords, issue secure HttpOnly sessions/tokens, and enforce role permissions on every API endpoint.
