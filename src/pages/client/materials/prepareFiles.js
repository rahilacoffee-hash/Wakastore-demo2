// Turns a picked photo / PDF into what the AI backend needs: { name, type, size, data (base64) }.
// Phone photos are shrunk first (long side 1800px, JPEG) so a list photo is ~300 KB instead of ~6 MB.
// Text on a list stays perfectly readable at that size, and it keeps the request small enough
// for the server (Vercel accepts about 4.5 MB per request).

// Total size of all base64 data we are willing to send in one request.
export const MAX_PAYLOAD_CHARS = 3_900_000

function readBase64(blob, onPct) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onprogress = (e) => { if (e.lengthComputable) onPct?.(Math.round((e.loaded / e.total) * 100)) }
    reader.onload = () => {
      const url = String(reader.result || '')
      const comma = url.indexOf(',')
      resolve(comma >= 0 ? url.slice(comma + 1) : '')
    }
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsDataURL(blob)
  })
}

// Returns a smaller JPEG Blob, or null when shrinking is not possible or not worth it.
async function shrinkImage(file, maxSide = 1800, quality = 0.82) {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close?.()
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
    return blob && blob.size < file.size ? blob : null
  } catch {
    return null
  }
}

export async function prepareFile(file, onPct) {
  const small = file.type.startsWith('image/') ? await shrinkImage(file) : null
  const blob = small || file
  const data = await readBase64(blob, onPct)
  if (!data) throw new Error(`Could not read "${file.name}".`)
  return { name: file.name, type: small ? 'image/jpeg' : file.type, size: blob.size, data }
}
