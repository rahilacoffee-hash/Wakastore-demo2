# WakaStore AI backend (quotation extraction)

Reads a customer's materials list from **pasted text**, **photos** or **PDFs** and returns
name / quantity / unit / specification lines for the review screen.

## Price rule (enforced in 4 places, upload AND paste)
Prices never enter a request. Merchants quote their own prices.
1. Pasted text: prices, totals, VAT, fees, bank lines and price-column headers are stripped **before** the text goes to the AI.
2. The AI tool schema has no price field, and the prompt forbids prices in any field.
3. Whatever the AI returns is swept again on the server (`sanitizeExtraction`), including extra price-named keys.
4. The browser sweeps again, strips prices typed in the review screen, and strips again when the quotation is submitted.
The customer sees "Prices in your list were removed." A bare number that only *might* be a price is flagged for checking, never silently deleted.
Shared code: `src/services/ai/priceGuard.js`.

## Files
- `server/` : `index.js` (local server), `http.js` (handlers), `extractCore.js`, `anthropic.js`, `prompt.js`. Zero dependencies.
- `api/extract-materials.js`, `api/health.js` : Vercel functions using the same handlers.

## Run locally (two terminals)
1. Put `ANTHROPIC_API_KEY=...` in `.env` (see `.env.example`).
2. `npm run server`   (port 8787)
3. `npm run dev`      (Vite proxies /api to the server)

## Deploy on Vercel
Add `ANTHROPIC_API_KEY` in Project Settings > Environment Variables, redeploy. Function limit is 60 s (set in code).

## Behaviour without the backend / key
Paste: parsed (still price-free) by the server's list reader, or in the browser if the server is offline.
Upload: with no server, a clearly labelled DEMO sample is shown. With the server up but no key: same demo. With key but AI failing: an honest error, never a fake list.

## Tests
`npm run test:price-guard` · `npm run test:ai-backend` · `npm run test:e2e-price`
