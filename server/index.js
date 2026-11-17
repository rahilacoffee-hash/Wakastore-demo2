// Local AI backend for WakaStore. Run with:  npm run server
// Zero dependencies. Reads ANTHROPIC_API_KEY from the project's .env file.
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHandlers } from './http.js'

const here = path.dirname(fileURLToPath(import.meta.url))

export function createApp({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const { handleExtract, handleHealth, resetRateLimit } = createHandlers({ env, fetchImpl })
  const server = http.createServer((req, res) => {
    const url = (req.url || '').split('?')[0]
    if (url === '/api/extract-materials') return handleExtract(req, res)
    if (url === '/api/health') return handleHealth(req, res)
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, code: 'NOT_FOUND', message: 'Not found.' }))
  })
  server.resetRateLimit = resetRateLimit
  return server
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try { process.loadEnvFile?.(path.join(here, '..', '.env')) } catch { /* no .env yet: fine */ }
  const port = Number(process.env.PORT || 8787)
  createApp().listen(port, '127.0.0.1', () => {
    const on = Boolean(String(process.env.ANTHROPIC_API_KEY || '').trim())
    console.log(`WakaStore AI backend on http://127.0.0.1:${port}`)
    console.log(on ? 'AI reader: ON (ANTHROPIC_API_KEY found).' : 'AI reader: OFF (no ANTHROPIC_API_KEY in .env). Pasted text still works; uploads need the key.')
  })
}
