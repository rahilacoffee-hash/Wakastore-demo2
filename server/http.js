// HTTP handlers shared by the local server (server/index.js) and Vercel (api/*.js).
// Plain Node (req, res): no framework, no dependencies.
import { LIMITS, runExtraction } from './extractCore.js'

const RATE = { windowMs: 60_000, max: 12 }
const hits = new Map() // ip -> timestamps (best effort: per server instance)

function limited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE.windowMs)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < RATE.windowMs)) hits.delete(k)
  return recent.length > RATE.max
}

const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()

function send(res, status, body, extra = {}) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  })
  res.end(json)
}

function cors(req, env) {
  const origin = req.headers.origin
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  return origin && allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    : {}
}

async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    // Vercel has already parsed the body.
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8'))
    if (typeof req.body === 'string') return JSON.parse(req.body)
    return req.body
  }
  const declared = Number(req.headers['content-length'] || 0)
  if (declared > LIMITS.maxBodyBytes) throw Object.assign(new Error('too large'), { status: 413 })
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > LIMITS.maxBodyBytes) throw Object.assign(new Error('too large'), { status: 413 })
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function createHandlers({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return {
    async handleExtract(req, res) {
      const headers = cors(req, env)
      if (req.method === 'OPTIONS') { res.writeHead(204, headers); return res.end() }
      if (req.method !== 'POST') return send(res, 405, { ok: false, code: 'METHOD', message: 'Use POST.' }, { ...headers, Allow: 'POST, OPTIONS' })
      if (!String(req.headers['content-type'] || '').toLowerCase().includes('application/json')) return send(res, 415, { ok: false, code: 'CONTENT_TYPE', message: 'Send application/json.' }, headers)
      if (limited(clientIp(req))) return send(res, 429, { ok: false, code: 'RATE_LIMITED', message: 'Too many requests. Please wait a minute and try again.' }, { ...headers, 'Retry-After': '60' })
      let body
      try {
        body = await readJson(req)
      } catch (e) {
        if (e?.status === 413) return send(res, 413, { ok: false, code: 'BODY_TOO_LARGE', message: 'These files are too large to send together. Remove a file or use smaller photos.' }, headers)
        return send(res, 400, { ok: false, code: 'BAD_JSON', message: 'Could not read the request.' }, headers)
      }
      try {
        const out = await runExtraction(body, { env, fetchImpl })
        return send(res, out.status, out.body, headers)
      } catch (e) {
        console.error('extract failed:', e?.message || e) // never log the list or the files
        return send(res, 500, { ok: false, code: 'SERVER_ERROR', message: 'Something went wrong on our side. Please try again.' }, headers)
      }
    },
    async handleHealth(req, res) {
      const headers = cors(req, env)
      return send(res, 200, { ok: true, aiConfigured: Boolean(String(env.ANTHROPIC_API_KEY || '').trim()) }, headers)
    },
    resetRateLimit() { hits.clear() },
  }
}
