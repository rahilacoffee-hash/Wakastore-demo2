// Bulk inventory import (CSV; Excel rows arrive here already parsed). Pure so it can be tested and reused by the backend.
export const COLUMN_ALIASES = {
  name: ['name', 'product', 'product name', 'item', 'material'],
  category: ['category', 'merchant category'],
  unit: ['unit', 'uom', 'unit of measure'],
  price: ['price', 'selling price', 'unit price', 'price (₦)', 'price (ngn)'],
  stock: ['stock', 'quantity', 'qty', 'available quantity', 'available'],
  brand: ['brand'],
  specs: ['specs', 'specification', 'specifications', 'spec'],
}
export const TEMPLATE_CSV = 'name,category,unit,price,stock,brand,specs\nCement 50kg,Cement Merchant,bag,9500,200,Dangote,Portland cement 42.5\nIron Rod 12mm,Iron Rods & Reinforcement Materials Merchant,piece,5200,500,,12mm ribbed\n'

export function parseCsv(text = '') {
  const rows = []; let row = [], cell = '', q = false
  const s = String(text).replace(/^\uFEFF/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { if (c === '"' && s[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') q = false; else cell += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some((x) => x.trim() !== '')) rows.push(row); row = [] }
    else cell += c
  }
  row.push(cell); if (row.some((x) => x.trim() !== '')) rows.push(row)
  return rows
}

const headerKey = (h) => { const t = String(h).trim().toLowerCase(); return Object.keys(COLUMN_ALIASES).find((k) => COLUMN_ALIASES[k].includes(t)) || null }
const num = (v) => { const n = Number(String(v ?? '').replace(/[₦,\s]/g, '')); return Number.isFinite(n) ? n : NaN }

// `table` = array of arrays (first row = headers). Returns { valid, errors, headerProblems }.
export function validateTable(table, { categories = [], existing = [] } = {}) {
  if (!table?.length) return { valid: [], errors: [], headerProblems: ['The file is empty.'] }
  const map = table[0].map(headerKey)
  const headerProblems = ['name', 'category', 'unit', 'price', 'stock'].filter((k) => !map.includes(k)).map((k) => `Missing column: ${k}`)
  if (headerProblems.length) return { valid: [], errors: [], headerProblems }
  const cats = new Map(categories.map((c) => [c.toLowerCase(), c]))
  const seen = new Set(existing.map((e) => `${e.name}|${e.unit}`.toLowerCase()))
  const valid = [], errors = []
  table.slice(1).forEach((cells, i) => {
    const r = {}; map.forEach((k, j) => { if (k) r[k] = String(cells[j] ?? '').trim() })
    const rowNo = i + 2, problems = []
    if (!r.name) problems.push('name is required')
    const category = cats.get(String(r.category).toLowerCase())
    if (!category) problems.push(`"${r.category || ''}" is not one of the 30 merchant categories`)
    if (!r.unit) problems.push('unit is required')
    const price = num(r.price); if (!(price > 0)) problems.push('price must be greater than 0')
    const stock = num(r.stock); if (!(stock >= 0) || !Number.isInteger(stock)) problems.push('stock must be a whole number, 0 or more')
    const key = `${r.name}|${r.unit}`.toLowerCase()
    if (r.name && seen.has(key)) problems.push('duplicate of an existing product or earlier row (same name and unit)')
    if (problems.length) return errors.push({ row: rowNo, message: problems.join('; '), raw: r })
    seen.add(key)
    valid.push({ name: r.name, category, unit: r.unit, price, stock, brand: r.brand || '', specs: r.specs || '' })
  })
  return { valid, errors, headerProblems: [] }
}
