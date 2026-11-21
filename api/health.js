// Vercel serverless function: GET /api/health
import { createHandlers } from '../server/http.js'

const { handleHealth } = createHandlers()

export default function handler(req, res) {
  return handleHealth(req, res)
}
