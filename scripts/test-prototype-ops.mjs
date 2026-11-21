import assert from 'node:assert/strict'
import { quoteDelivery, zoneFor, DEFAULT_RATE_CARD } from '../src/services/delivery.js'
import { parseCsv, validateTable, TEMPLATE_CSV } from '../src/services/inventoryImport.js'
import { importableJobs, jobToLines, procurementTimeline, SMARTFIXER_JOBS } from '../src/services/smartfixer.js'
import { buildLogEntries, retryEntry } from '../src/services/notificationLog.js'
import { computeReports } from '../src/services/reports.js'
import { MERCHANT_CATEGORY_NAMES } from '../src/constants/categories.js'

// delivery
const abuja = { id: 'm1', address: 'Wuse II, Abuja' }, lagos = { id: 'm2', address: 'Ikeja, Lagos' }
const addr = { city: 'Abuja', state: 'FCT' }
assert.equal(zoneFor(addr, [abuja]), 'sameCity')
assert.equal(quoteDelivery({ method: 'merchant', address: addr, merchants: [abuja] }).fee, 3500)
assert.equal(quoteDelivery({ method: 'pickup', address: addr, merchants: [abuja] }).fee, 0)
assert.equal(quoteDelivery({ method: 'wakarider', address: addr, merchants: [abuja] }).fee, 2500)
assert.equal(quoteDelivery({ method: 'merchant', address: addr, merchants: [abuja, lagos] }).fee, 12000 + 1500, 'furthest zone + extra stop')
assert.equal(quoteDelivery({ method: 'wakarider', address: addr, merchants: [lagos] }).available, false, 'WakaRider not offered across states')
assert.equal(quoteDelivery({ method: 'merchant', address: {}, merchants: [abuja] }).available, false, 'needs an address')

// csv import
const t = parseCsv(TEMPLATE_CSV)
const ok = validateTable(t, { categories: MERCHANT_CATEGORY_NAMES })
assert.equal(ok.valid.length, 2); assert.equal(ok.errors.length, 0)
const bad = validateTable(parseCsv('name,category,unit,price,stock\nX,Nope,bag,-5,1.5\n"Cement, 50kg",Cement Merchant,bag,"₦9,500",10\n'), { categories: MERCHANT_CATEGORY_NAMES })
assert.equal(bad.valid.length, 1); assert.equal(bad.valid[0].name, 'Cement, 50kg'); assert.equal(bad.valid[0].price, 9500)
assert.match(bad.errors[0].message, /merchant categories.*price.*stock/)
assert.ok(validateTable(parseCsv('name,price\nA,1'), { categories: [] }).headerProblems.length)
const dup = validateTable(parseCsv('name,category,unit,price,stock\nCement 50kg,Cement Merchant,bag,9500,5'), { categories: MERCHANT_CATEGORY_NAMES, existing: [{ name: 'cement 50kg', unit: 'Bag' }] })
assert.match(dup.errors[0].message, /duplicate/)

// smartfixer
assert.equal(importableJobs().length, 2)
const lines = jobToLines(SMARTFIXER_JOBS[0]); assert.equal(lines[0].quantity, 20); assert.equal(lines[0].specs, '50kg')
assert.equal(procurementTimeline({}).steps.filter((s) => s.done).length, 0)
const tl = procurementTimeline({ quotation: { customerApprovedAt: 'x', orderId: 'WK-1' }, offers: [{}], order: { subOrders: [{ status: 'Dispatched' }], items: [] } })
assert.deepEqual(tl.steps.filter((s) => s.done).map((s) => s.key), ['submitted', 'quoted', 'approved', 'paid', 'preparing', 'dispatched'])

// notification log
const e = buildLogEntries({ id: 'n-1', title: 'Payment received', detail: 'x' }); assert.ok(e.some((x) => x.channel === 'sms'))
assert.ok(!buildLogEntries({ id: 'n-2', title: 'Welcome', detail: 'hi' }).some((x) => x.channel === 'sms'))
const failed = Array.from({ length: 60 }, (_, i) => buildLogEntries({ id: `n-${i}`, title: 'Order dispatched' })).flat().find((x) => x.status === 'failed')
assert.ok(failed && failed.reason); assert.equal(retryEntry(failed).status, 'delivered'); assert.equal(retryEntry(failed).attempts, 2)

// reports
const r = computeReports({ merchants: [{ id: 'a', name: 'A', status: 'approved', categories: ['Cement Merchant'] }], orders: [], quotations: [{ id: 'q', createdAt: '2026-11-20T00:00:00Z', matchedMerchants: ['A'] }], merchantQuotes: [{ quotationId: 'q', merchantId: 'a', submittedAt: '2026-11-20T06:00:00Z' }], products: [] })
assert.equal(r.kpis.avgResponseHours, 6); assert.equal(r.ranking[0].responseRate, 1); assert.ok(r.ranking[0].score > 80)
console.log('Prototype ops tests passed (delivery fees, CSV import, SmartFixer timeline, notification log, reports).')
