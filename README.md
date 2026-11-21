# WakaStore demo — enhanced quotation prototype

This source package contains the existing WakaStore demo marketplace plus the updated quotation workflow.

## Run locally

Requirements: Node.js 22.22+ recommended and npm.

```bash
npm install
npm run dev
```

Open the local Vite URL printed in the terminal.

Production bundle:

```bash
npm run build
npm run preview
```

## Demo accounts

Password for the seeded demo accounts: `waka123`

- Customer: `customer1@waka.test`
- Merchant: `merchant@waka.test`
- Merchant: `powerhouse@waka.test`
- Merchant: `colourcraft@waka.test`
- Admin: `admin@waka.test`
- Super Admin: `superadmin@waka.test`

## Updated quotation flow

Read `FINAL-PROTOTYPE-NEW-FLOW.md` for the approved product rules and complete customer, merchant and admin journeys.

## Verification

Run the focused updated-flow rule checks with:

```bash
npm run test:final-flow
```

The updated source passed a syntax transpilation check across all 72 JS/JSX files. The matching, MVP matching, sourcing, categories, merchant-demo, engine (33/33) and account tests passed in the working environment.

A full Vite build could not be completed in the working environment because `npm install` timed out while downloading dependencies. Run `npm install` locally, then `npm run build`.

## Important prototype boundary

This is a frontend/local-browser prototype. It does not process real payments, hold real funds, make real payouts, provide production escrow/custody, synchronize data across devices, or dispatch real WakaRider deliveries. Payment verification and settlement are simulated. A production backend, compliant payment provider and appropriate fund custody/settlement arrangement are required before launch.
