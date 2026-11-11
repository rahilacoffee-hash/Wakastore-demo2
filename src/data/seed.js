// Single coherent demo dataset. Every role reads/writes this one shape.
// All demo accounts use password: waka123
const P = (id, merchantId, name, category, unit, price, stock, aliases = []) => ({ id, merchantId, name, category, unit, price, stock, available: true, aliases })

export const seedState = () => ({
  seq: 1000,
  settings: { feeRate: 0.025, threshold: 60, resubmitWorkingDays: 5, holidays: [] },
  users: [
    { id: 'c-1', role: 'customer', name: 'Ada Okafor', email: 'customer1@waka.test', password: 'waka123', phone: '+234 810 200 5001', status: 'active' },
    { id: 'c-2', role: 'customer', name: 'Kelechi Martins', email: 'customer2@waka.test', password: 'waka123', phone: '+234 810 200 5002', status: 'active' },
    { id: 'u-ma', role: 'merchant', merchantId: 'm-a', name: 'BuildRight Owner', email: 'merchant.a@waka.test', password: 'waka123' },
    { id: 'u-mb', role: 'merchant', merchantId: 'm-b', name: 'PowerHouse Owner', email: 'merchant.b@waka.test', password: 'waka123' },
    { id: 'u-mc', role: 'merchant', merchantId: 'm-c', name: 'Tile District Owner', email: 'merchant.c@waka.test', password: 'waka123' },
    { id: 'u-md', role: 'merchant', merchantId: 'm-d', name: 'Prime Plumbing Owner', email: 'merchant.pending@waka.test', password: 'waka123' },
    { id: 'u-ad', role: 'admin', name: 'Admin Demo', email: 'admin@waka.test', password: 'waka123', status: 'active' },
    { id: 'u-sa', role: 'super-admin', name: 'Super Admin Demo', email: 'super@waka.test', password: 'waka123', status: 'active' }
  ],
  merchants: [
    { id: 'm-a', name: 'BuildRight Supplies', status: 'approved', address: 'Lekki Phase 1, Lagos', categories: ['Cement Merchant', 'Iron Rods & Reinforcement Materials Merchant', 'Roofing Materials & Accessories Merchant'] },
    { id: 'm-b', name: 'PowerHouse Electrical', status: 'approved', address: 'Abule Egba, Lagos', categories: ['Electrical Materials Merchant', 'Cement Merchant', 'Plumbing Materials Merchant'] },
    { id: 'm-c', name: 'Tile District', status: 'approved', address: 'Ikeja, Lagos', categories: ['Tiles Merchant', 'Paint Merchant', 'Doors, Locks & Hardware Merchant'] },
    { id: 'm-d', name: 'Prime Plumbing Hub', status: 'pending', address: 'Gbagada, Lagos', categories: ['Plumbing Materials Merchant'] }
  ],
  products: [
    P('p1', 'm-a', 'Dangote Cement 50kg', 'Cement Merchant', 'bags', 10800, 400),
    P('p2', 'm-a', 'Iron Rod 12mm', 'Iron Rods & Reinforcement Materials Merchant', 'lengths', 15400, 300),
    P('p3', 'm-a', 'Longspan Roofing Sheet', 'Roofing Materials & Accessories Merchant', 'bundles', 18900, 60),
    P('p4', 'm-a', 'Tile Adhesive 25kg', 'Tile Adhesive & Grout Merchant', 'bags', 6500, 120),
    P('p5', 'm-a', 'Binding Wire', 'Iron Rods & Reinforcement Materials Merchant', 'rolls', 22000, 40),
    P('p6', 'm-b', 'Dangote Cement 50kg', 'Cement Merchant', 'bags', 10500, 150),
    P('p7', 'm-b', '2.5mm Single Core Cable', 'Electrical Materials Merchant', 'metres', 900, 2000),
    P('p8', 'm-b', 'PVC Pressure Pipe 4in', 'Plumbing Materials Merchant', 'pieces', 7200, 90),
    P('p9', 'm-b', 'Tile Adhesive 25kg', 'Tile Adhesive & Grout Merchant', 'bags', 6200, 80),
    P('p10', 'm-b', 'Roofing Sheet', 'Roofing Materials & Accessories Merchant', 'bundles', 18000, 8),
    P('p11', 'm-c', '60x60 Ceramic Tile', 'Tiles Merchant', 'boxes', 14500, 500),
    P('p12', 'm-c', 'Emulsion Paint 20L', 'Paint Merchant', 'buckets', 31500, 70),
    P('p13', 'm-c', 'Flush Door', 'Doors, Locks & Hardware Merchant', 'pieces', 45000, 30),
    P('p14', 'm-c', 'Dangote Cement 50kg', 'Cement Merchant', 'bags', 11000, 20),
    P('p16', 'm-a', '2.5mm Single Core Cable', 'Electrical Materials Merchant', 'metres', 950, 1500),
    P('p17', 'm-a', 'PVC Pressure Pipe 4in', 'Plumbing Materials Merchant', 'pieces', 7400, 60),
    P('p18', 'm-a', 'Emulsion Paint 20L', 'Paint Merchant', 'buckets', 32000, 50),
    P('p19', 'm-b', 'Flush Door', 'Doors, Locks & Hardware Merchant', 'pieces', 46000, 25),
    P('p15', 'm-d', 'PVC Pressure Pipe 4in', 'Plumbing Materials Merchant', 'pieces', 6800, 200)
  ],
  quotations: [], orders: [], subOrders: [], payments: [], receipts: [], refunds: [],
  complaints: [], sourcing: [], notifications: [], audit: [], idem: {},
  wallet: [{ id: 'tx-1', customerId: 'c-1', type: 'credit', kind: 'funding', amount: 500000, ref: 'DEMO-FUND-1', date: '2026-11-01T09:00:00Z', status: 'success' }]
})
