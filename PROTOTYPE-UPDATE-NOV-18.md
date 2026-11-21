# WakaStore prototype update history

The 18 November quotation + chat iteration is superseded by the final quotation flow in `FINAL-PROTOTYPE-NEW-FLOW.md` (20 November 2026).

The current prototype:
- Invites every merchant meeting at least 60% inventory coverage, including inventory records that are out of stock.
- Requires a complete merchant quotation covering every requested line and full quantity.
- Requires explicit per-line `Can be supplied`, `Can be sourced`, or `Cannot be sourced` status.
- Blocks submission when any requested line is marked `Cannot be sourced`.
- Gives merchants 24 hours to respond and each offer 48 hours of validity.
- Ranks valid complete offers by total quoted cost and prioritizes the two lowest-priced offers while keeping other valid offers available.
- Assigns the entire materials list to one selected primary merchant; no automatic secondary supplier split.
- Supports merchant delivery, customer collection and WakaRider where available.
- Uses a simulated payment state with pending settlement.
- Calculates the 5% WakaStore commission on accepted materials value only, excluding delivery.
- Requires complete delivery and customer acceptance; missing acceptance goes to admin intervention, not automatic release.
- Preserves the Direct Marketplace and separate merchant onboarding application.

See `FINAL-PROTOTYPE-NEW-FLOW.md` for the complete rules, customer and merchant journeys, admin workflow and prototype limitations.
