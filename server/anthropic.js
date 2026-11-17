// One small function that calls the AI provider. No SDK, no dependencies.
// To use a different provider later, replace this file and keep the same signature.
import { SYSTEM_PROMPT, TOOL } from './prompt.js'

const API_URL = 'https://api.anthropic.com/v1/messages'
export const DEFAULT_MODEL = 'claude-sonnet-5-5'

export class ProviderError extends Error {
  constructor(message, { status = 0, kind = 'failed' } = {}) {
    super(message)
    this.status = status
    this.kind = kind // 'busy' | 'timeout' | 'failed'
  }
}

export async function callModel({ apiKey, model = DEFAULT_MODEL, content, fetchImpl = globalThis.fetch, timeoutMs = 50_000 }) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    let res
    try {
      res = await fetchImpl(API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model,
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          tools: [TOOL],
          tool_choice: { type: 'tool', name: TOOL.name },
          messages: [{ role: 'user', content }],
        }),
        signal: ctrl.signal,
      })
    } catch (e) {
      if (e?.name === 'AbortError') throw new ProviderError('The AI service took too long to answer.', { kind: 'timeout' })
      throw new ProviderError('Could not reach the AI service.', { kind: 'failed' })
    }
    if (!res.ok) {
      const kind = res.status === 429 || res.status === 529 ? 'busy' : 'failed'
      throw new ProviderError(`AI provider returned ${res.status}`, { status: res.status, kind })
    }
    const data = await res.json()
    const block = Array.isArray(data?.content) ? data.content.find((b) => b?.type === 'tool_use' && b?.name === TOOL.name) : null
    if (!block?.input || typeof block.input !== 'object') throw new ProviderError('The AI service returned no usable list.', { kind: 'failed' })
    return block.input
  } finally {
    clearTimeout(timer)
  }
}
