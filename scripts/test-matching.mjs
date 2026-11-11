import { matchQuotation, parseMaterialsList, bestBasket, groupSelectionByMerchant } from '../src/services/matching.js'

const text = `50 bags of Dangote cement
20 lengths of 12mm iron rod
10 bundles of roofing sheet
15 bags of tile adhesive
30 metres of 2.5mm cable
8 pieces of 4in PVC pipe
12 buckets of emulsion paint
40 boxes of 60x60 ceramic tile
6 pieces of flush door
25 rolls of binding wire`
const lines = parseMaterialsList(text)
console.log('parsed lines:', lines.length, lines[0])

const P = (id, merchantId, name, unit, price, stock = 100, extra = {}) => ({ id, merchantId, name, unit, price, stock, available: true, ...extra })
const merchants = [
  { id: 'A', name: 'Merchant A', status: 'approved' },
  { id: 'B', name: 'Merchant B', status: 'approved' },
  { id: 'C', name: 'Merchant C', status: 'approved' },
  { id: 'D', name: 'Merchant D (suspended)', status: 'suspended' }
]
const products = [
  // A: 8 lines
  P('a1','A','Dangote Cement 50kg','bags',10800), P('a2','A','Iron Rod 12mm','lengths',15400),
  P('a3','A','Longspan Roofing Sheet','bundles',18900), P('a4','A','Tile Adhesive 25kg','bags',6500),
  P('a5','A','2.5mm Single Core Cable','metres',900), P('a6','A','PVC Pressure Pipe 4in','pieces',7200),
  P('a7','A','Emulsion Paint 20L','buckets',31500), P('a8','A','Binding Wire','rolls',22000, 100),
  // B: 6 lines (one wrong size: 16mm rod must NOT match 12mm)
  P('b1','B','Dangote Cement 50kg','bags',10500), P('b2','B','Iron Rod 16mm','lengths',19000),
  P('b3','B','Roofing Sheet','bundles',18000), P('b4','B','Tile Adhesive','bags',6200),
  P('b5','B','2.5mm Cable','metres',850), P('b6','B','Ceramic Tile 60x60','boxes',14500),
  P('b7','B','Flush Door','pieces',45000), P('b8','B','Emulsion Paint 20L','buckets',30000, 0), // out of stock
  // C: 4 lines
  P('c1','C','Dangote Cement 50kg','bags',11000), P('c2','C','Ceramic Tile 60x60','boxes',14000),
  P('c3','C','Flush Door','pieces',42000), P('c4','C','Binding Wire','rolls',21000, 10),
  // D suspended: has everything but must be excluded
  P('d1','D','Dangote Cement 50kg','bags',9000)
]
const m = matchQuotation(lines, merchants, products)
m.results.forEach(r => console.log(r.merchant.name.padEnd(24), `${r.matchedCount}/${r.totalLines}`, r.percentage + '%', r.eligible ? 'ELIGIBLE' : 'not eligible', '₦' + r.subtotal))
console.log('unmatched by everyone:', m.needsSourcing.map(l => l.name))
const basket = bestBasket(m)
console.log('best basket groups:', groupSelectionByMerchant(basket).map(g => `${g.merchantName}: ${g.items.length} lines ₦${g.subtotal}`))
const pass = m.results.find(r=>r.merchant.id==='A').percentage===80
  && m.results.find(r=>r.merchant.id==='B').percentage===60
  && m.results.find(r=>r.merchant.id==='C').percentage===40
  && m.eligible.length===2 && !m.results.some(r=>r.merchant.id==='D')
console.log(pass ? 'PASS: 80 / 60 / 40, C excluded, suspended D ignored' : 'FAIL')
process.exit(pass?0:1)
