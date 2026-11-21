// Demo catalogue that guarantees EVERY one of the 30 official WakaStore
// categories has products a shopper can actually see and buy.
//
// - 10 extra APPROVED merchants, each declaring only the categories they sell.
// - 2 products per category (60 total), always sold by an approved merchant
//   that lists that category.
// - Prices are rough 2026 Nigerian market figures in Naira (demo only).
// - Images are generated branded placeholders (inline SVG) so nothing depends
//   on an external photo host. Swap `image` for real photos whenever ready.
//
// These are merged into saved state by id (see withSeedExtras in quoteSeed.js),
// so existing localStorage data is kept and re-running the merge is a no-op.
// Deliberately NOT assigned to m-101 / m-102 / m-106 so the quotation-matching
// percentages for those demo merchants stay exactly as tested.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Split a product name into at most two lines of ~20 characters.
const wrap = (name) => {
  const words = String(name).split(' ')
  const lines = ['']
  for (const w of words) {
    const cur = lines[lines.length - 1]
    if ((cur + ' ' + w).trim().length > 20 && lines.length < 2) lines.push(w)
    else lines[lines.length - 1] = (cur + ' ' + w).trim()
  }
  return lines
}

export const placeholderImage = (name, label, tone = 0) => {
  const bg = ['#FCEBED', '#F3F1F1'][tone % 2]
  const [l1, l2 = ''] = wrap(name)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700">` +
    `<rect width="700" height="700" fill="${bg}"/>` +
    `<rect x="60" y="60" width="90" height="10" rx="5" fill="#ED0018"/>` +
    `<text x="60" y="120" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" letter-spacing="3" fill="#ED0018">${esc(String(label).toUpperCase())}</text>` +
    `<text x="60" y="${l2 ? 400 : 430}" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800" fill="#171717">${esc(l1)}</text>` +
    (l2 ? `<text x="60" y="470" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800" fill="#171717">${esc(l2)}</text>` : '') +
    `<text x="60" y="640" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#171717" opacity=".45">WAKASTORE</text>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const m = (id, name, address, description, categories, approvedAt) => ({
  id, name, status: 'approved', contact: `+234 801 000 ${String(1000 + Number(id.slice(2)))}`,
  address, description, categories, approvedAt, rejectionReason: ''
})

export const CATEGORY_MERCHANTS = [
  m('m-107', 'Kubwa Aggregates & Blocks', 'Kubwa, Abuja', 'Cement, sand, granite chippings and blocks delivered by the trip.',
    ['Cement Merchant', 'Sand Merchant', 'Chippings/Granite Merchant', 'Blocks Merchant'], '2026-10-08'),
  m('m-108', 'Timberline Wood & Boards', 'Ojota, Lagos', 'Timber, plywood, MDF and furniture fittings for builders and carpenters.',
    ['Timber Merchant', 'Plywood & Board Merchant', 'MDF & Furniture Board Merchant', 'Furniture Fittings & Accessories Merchant'], '2026-10-09'),
  m('m-109', 'BrightSpark Lighting Hub', 'Wuse Market, Abuja', 'Electrical accessories, distribution boards and LED lighting.',
    ['Electrical Materials Merchant', 'Lighting & Light Fittings Merchant'], '2026-10-10'),
  m('m-110', 'Luxe Bath & Sanitary', 'Victoria Island, Lagos', 'Toilets, basins and complete bathroom sets.',
    ['Sanitary Ware Merchant'], '2026-10-11'),
  m('m-111', 'Interior Finish Depot', 'Garki, Abuja', 'Paint, putty, POP, gypsum, ceilings and wall coverings.',
    ['Paint Merchant', 'Screeding & Wall Finishes Materials Merchant', 'POP & Gypsum Materials Merchant', 'Ceiling Materials Merchant', 'Wallpaper & Wall Panel Merchant'], '2026-10-12'),
  m('m-112', 'Window Dressing Studio', 'Maitama, Abuja', 'Ready-made and made-to-measure curtains and blinds.',
    ['Curtains & Blinds Merchant'], '2026-10-13'),
  m('m-113', 'AluGlass Metalworks', 'Ilupeju, Lagos', 'Iron rods, aluminium profiles, glass and welding supplies.',
    ['Iron Rods & Reinforcement Materials Merchant', 'Aluminium Materials Merchant', 'Glass Merchant', 'Steel, Metal & Welding Materials Merchant'], '2026-10-14'),
  m('m-114', 'Handy Hardware Mart', 'Karu, Abuja', 'Doors, locks, tools, sealants and pest control supplies.',
    ['Doors, Locks & Hardware Merchant', 'General Hardware Merchant', 'Sealants, Silicone & Adhesives Merchant', 'Pest Control & Fumigation Supplies Merchant'], '2026-10-15'),
  m('m-115', 'StoneCraft Marble & Tiles', 'Jabi, Abuja', 'Floor tiles, marble and granite slabs, adhesives and grout.',
    ['Tiles Merchant', 'Marble & Granite Merchant', 'Tile Adhesive & Grout Merchant'], '2026-10-16'),
  m('m-116', 'Naija Roof & Pipe Depot', 'Oshodi, Lagos', 'Roofing tiles and accessories, plus PPR and plumbing fittings.',
    ['Roofing Materials & Accessories Merchant', 'Plumbing Materials Merchant'], '2026-10-17')
]

const merchantName = Object.fromEntries(CATEGORY_MERCHANTS.map((x) => [x.id, x.name]))

// [merchantId, name, category, unit, price, stock]  (two rows per category, in category order)
const ROWS = [
  ['m-107', 'BUA Cement 42.5R 50kg', 'Cement Merchant', 'bag', 11200, 320],
  ['m-107', 'Lafarge Elephant Cement 50kg', 'Cement Merchant', 'bag', 11800, 240],
  ['m-107', 'Sharp Sand (Tipper Load)', 'Sand Merchant', 'trip', 85000, 14],
  ['m-107', 'Plaster Sand (Half Trip)', 'Sand Merchant', 'trip', 70000, 18],
  ['m-107', 'Granite Chippings 3/4in (Tipper Load)', 'Chippings/Granite Merchant', 'trip', 220000, 9],
  ['m-107', 'Crushed Granite 1/2in', 'Chippings/Granite Merchant', 'tonne', 28000, 60],
  ['m-107', '9in Hollow Sandcrete Block', 'Blocks Merchant', 'piece', 650, 5000],
  ['m-107', '6in Solid Sandcrete Block', 'Blocks Merchant', 'piece', 520, 4200],
  ['m-113', 'Iron Rod 16mm (Y16)', 'Iron Rods & Reinforcement Materials Merchant', 'length', 24500, 260],
  ['m-113', 'Iron Rod 10mm (Y10)', 'Iron Rods & Reinforcement Materials Merchant', 'length', 9800, 540],
  ['m-108', 'Treated Timber 2x4 (12ft)', 'Timber Merchant', 'piece', 3800, 700],
  ['m-108', 'Hardwood Timber 2x2 (12ft)', 'Timber Merchant', 'piece', 2200, 900],
  ['m-108', 'Marine Plywood 18mm 4x8ft', 'Plywood & Board Merchant', 'sheet', 42000, 85],
  ['m-108', 'Plywood 12mm 4x8ft', 'Plywood & Board Merchant', 'sheet', 28500, 140],
  ['m-116', 'Stone-Coated Roof Tile (Classic)', 'Roofing Materials & Accessories Merchant', 'piece', 6800, 1200],
  ['m-116', 'Roofing Nails with Washers (1kg Pack)', 'Roofing Materials & Accessories Merchant', 'pack', 3200, 400],
  ['m-109', '13A Heavy-Duty Socket Outlet', 'Electrical Materials Merchant', 'piece', 2800, 650],
  ['m-109', '12-Way Distribution Board 63A', 'Electrical Materials Merchant', 'piece', 38500, 45],
  ['m-109', 'LED Panel Light 18W Round', 'Lighting & Light Fittings Merchant', 'piece', 3600, 800],
  ['m-109', 'Rechargeable LED Floodlight 100W', 'Lighting & Light Fittings Merchant', 'piece', 24500, 70],
  ['m-116', 'PPR Pipe 25mm (4m)', 'Plumbing Materials Merchant', 'length', 2400, 600],
  ['m-116', 'Brass Ball Valve 1/2in', 'Plumbing Materials Merchant', 'piece', 3900, 300],
  ['m-110', 'Close-Coupled WC Set (White)', 'Sanitary Ware Merchant', 'set', 85000, 30],
  ['m-110', 'Wash Hand Basin with Pedestal', 'Sanitary Ware Merchant', 'set', 48000, 42],
  ['m-115', '40x40 Matt Porcelain Floor Tile', 'Tiles Merchant', 'box', 11800, 420],
  ['m-115', '30x60 Glazed Wall Tile', 'Tiles Merchant', 'box', 13500, 360],
  ['m-115', 'Italian Carrara Marble Slab 2cm', 'Marble & Granite Merchant', 'piece', 145000, 12],
  ['m-115', 'Black Galaxy Granite Slab', 'Marble & Granite Merchant', 'piece', 98000, 16],
  ['m-115', 'Waterproof Grout 5kg Bag', 'Tile Adhesive & Grout Merchant', 'bag', 5200, 280],
  ['m-115', 'Polymer Tile Bond 20kg Bag', 'Tile Adhesive & Grout Merchant', 'bag', 7600, 190],
  ['m-111', 'Gloss Enamel Paint 4L', 'Paint Merchant', 'tin', 7800, 210],
  ['m-111', 'Satin Finish Paint 10L', 'Paint Merchant', 'bucket', 21500, 95],
  ['m-111', 'Wall Putty 20kg Bag', 'Screeding & Wall Finishes Materials Merchant', 'bag', 9500, 150],
  ['m-111', 'Cement-Based Screed Mix 25kg', 'Screeding & Wall Finishes Materials Merchant', 'bag', 6800, 170],
  ['m-111', 'POP (Plaster of Paris) 25kg Bag', 'POP & Gypsum Materials Merchant', 'bag', 8500, 220],
  ['m-111', 'Gypsum Board 12mm 4x8ft', 'POP & Gypsum Materials Merchant', 'sheet', 14500, 120],
  ['m-111', 'PVC Ceiling Panel (5.95m)', 'Ceiling Materials Merchant', 'piece', 4200, 480],
  ['m-111', 'Ceiling Main Tee Channel (3.6m)', 'Ceiling Materials Merchant', 'piece', 2100, 650],
  ['m-114', 'Solid Panel Door 7ft', 'Doors, Locks & Hardware Merchant', 'piece', 135000, 22],
  ['m-114', 'Security Mortise Lock Set', 'Doors, Locks & Hardware Merchant', 'set', 18500, 110],
  ['m-113', 'Aluminium Sliding Window (4x4ft)', 'Aluminium Materials Merchant', 'set', 68000, 26],
  ['m-113', 'Aluminium Box Profile 1x1in (6m)', 'Aluminium Materials Merchant', 'length', 7800, 340],
  ['m-113', 'Clear Float Glass 5mm 4x6ft', 'Glass Merchant', 'sheet', 28500, 60],
  ['m-113', 'Tinted Glass 6mm 4x6ft', 'Glass Merchant', 'sheet', 36500, 44],
  ['m-113', 'Mild Steel Square Tube 1x1in (6m)', 'Steel, Metal & Welding Materials Merchant', 'length', 9800, 280],
  ['m-113', 'Welding Electrodes 3.2mm (5kg Pack)', 'Steel, Metal & Welding Materials Merchant', 'pack', 14500, 90],
  ['m-108', 'MDF Board 18mm 4x8ft', 'MDF & Furniture Board Merchant', 'sheet', 31500, 110],
  ['m-108', 'White Melamine Board 18mm 4x8ft', 'MDF & Furniture Board Merchant', 'sheet', 38500, 75],
  ['m-108', 'Soft-Close Cabinet Hinges (Pair)', 'Furniture Fittings & Accessories Merchant', 'pair', 2800, 900],
  ['m-108', 'Telescopic Drawer Runners 18in (Pair)', 'Furniture Fittings & Accessories Merchant', 'pair', 3600, 700],
  ['m-111', '3D Textured Wallpaper Roll (10m)', 'Wallpaper & Wall Panel Merchant', 'roll', 24500, 65],
  ['m-111', 'Fluted PVC Wall Panel (2.9m)', 'Wallpaper & Wall Panel Merchant', 'piece', 8500, 260],
  ['m-112', 'Blackout Curtain Set (Ready-Made)', 'Curtains & Blinds Merchant', 'set', 38500, 40],
  ['m-112', 'Zebra Roller Blind 120x220cm', 'Curtains & Blinds Merchant', 'piece', 22500, 55],
  ['m-114', 'Claw Hammer 16oz', 'General Hardware Merchant', 'piece', 4800, 320],
  ['m-114', 'Wire Nails 3in (1kg Pack)', 'General Hardware Merchant', 'pack', 2200, 800],
  ['m-114', 'Neutral Silicone Sealant 300ml (Clear)', 'Sealants, Silicone & Adhesives Merchant', 'tube', 3200, 500],
  ['m-114', 'Polyurethane Construction Adhesive 600ml', 'Sealants, Silicone & Adhesives Merchant', 'tube', 6800, 230],
  ['m-114', 'Termiticide Concentrate 1L', 'Pest Control & Fumigation Supplies Merchant', 'litre', 14500, 85],
  ['m-114', 'Rodent Bait Station Pack (6)', 'Pest Control & Fumigation Supplies Merchant', 'pack', 9800, 120]
]

const shortLabel = (cat) => cat.replace(/ Materials Merchant$/, '').replace(/ Merchant$/, '')

export const CATEGORY_PRODUCTS = ROWS.map(([merchantId, name, category, unit, price, stock], i) => ({
  id: `cp-${String(i + 1).padStart(3, '0')}`,
  name,
  merchant: merchantName[merchantId],
  merchantId,
  price,
  category,
  image: placeholderImage(name, shortLabel(category), i),
  stock,
  unit,
  available: true
}))
