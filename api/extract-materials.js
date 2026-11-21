// Vercel serverless function: POST /api/extract-materials
import { createHandlers } from '../server/http.js'

export const config = { maxDuration: 60 }
const { handleExtract } = createHandlers()

export default function handler(req, res) {
  return handleExtract(req, res)
}
