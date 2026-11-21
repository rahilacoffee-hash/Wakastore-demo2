// SmartFixer -> WakaStore handoff (PROTOTYPE: jobs are mock data; production uses a secure server-to-server integration).
export const SMARTFIXER_JOBS = [
  { id: 'SF-2041', title: 'Kitchen renovation', location: 'Gwarinpa, Abuja', fixer: 'Musa Bello', customerEmail: '', status: 'Materials approved',
    materials: [
      { name: 'Cement', quantity: 20, unit: 'bags', specs: '50kg' },
      { name: 'Sharp Sand', quantity: 3, unit: 'tonnes', specs: '' },
      { name: 'Wall Tiles', quantity: 40, unit: 'boxes', specs: '30x60 glazed' },
      { name: 'Tile Adhesive', quantity: 10, unit: 'bags', specs: '' },
    ] },
  { id: 'SF-2057', title: 'Bathroom plumbing repair', location: 'Wuse II, Abuja', fixer: 'Ibrahim Sani', customerEmail: '', status: 'Materials approved',
    materials: [
      { name: 'PVC Pipe', quantity: 12, unit: 'lengths', specs: '1 inch' },
      { name: 'Gate Valve', quantity: 3, unit: 'pieces', specs: '' },
      { name: 'Teflon Tape', quantity: 6, unit: 'rolls', specs: '' },
    ] },
  { id: 'SF-2063', title: 'Roof leak fix', location: 'Maitama, Abuja', fixer: 'Chidi Eze', customerEmail: '', status: 'Awaiting material approval',
    materials: [{ name: 'Longspan Roofing Sheet', quantity: 8, unit: 'pieces', specs: '' }] },
]
export const importableJobs = (jobs = SMARTFIXER_JOBS) => jobs.filter((j) => j.status === 'Materials approved' && j.materials.length)

// Quotation-line shape used by createQuotationFull, quantities and specs preserved.
export const jobToLines = (job) => job.materials.map((m, i) => ({ id: `sf-${job.id}-${i + 1}`, name: m.name, quantity: m.quantity, unit: m.unit, specs: m.specs || '', category: '', brand: '', notes: '' }))

// Status events SmartFixer should receive, derived from the live quotation/order (so it can never drift out of sync).
export function procurementTimeline({ quotation, offers = [], order } = {}) {
  const subs = order?.subOrders || []
  const subIs = (...s) => subs.some((x) => s.includes(x.status))
  const items = order?.items || []
  const allAccepted = items.length > 0 && items.every((i) => i.fulfilment === 'ACCEPTED')
  const delivered = subIs('Delivered', 'Completed') || items.some((i) => ['DELIVERED', 'ACCEPTED'].includes(i.fulfilment))
  const exception = items.some((i) => i.dispute?.status === 'OPEN' || i.sourcingStatus === 'UNRESOLVED')
  const steps = [
    ['submitted', 'Request submitted', Boolean(quotation)],
    ['quoted', 'Quotations received', offers.length > 0],
    ['approved', 'Proposal approved', Boolean(quotation?.customerApprovedAt)],
    ['paid', 'Payment confirmed', Boolean(quotation?.orderId || order)],
    ['preparing', 'Materials being prepared', subIs('Accepted', 'Packed', 'Dispatched', 'Delivered', 'Completed') || Boolean(order?.dispatch)],
    ['dispatched', 'Materials dispatched', subIs('Dispatched', 'Delivered', 'Completed') || Boolean(order?.dispatch) || delivered],
    ['delivered', 'Complete delivery', delivered],
    ['completed', 'Procurement completed', allAccepted || order?.status === 'Completed'],
  ].map(([key, label, done]) => ({ key, label, done: Boolean(done) }))
  return { steps, exception }
}
