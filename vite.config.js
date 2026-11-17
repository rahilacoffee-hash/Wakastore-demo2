import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In development, /api/* is forwarded to the local AI backend (`npm run server`, port 8787).
// If the backend is not running, the app quietly falls back to its demo mode.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: false, code: 'BACKEND_OFFLINE', message: 'The AI backend is not running.' }))
            }
          })
        },
      },
    },
  },
})
