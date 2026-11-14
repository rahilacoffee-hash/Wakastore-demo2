import {
  Blocks, Bolt, Droplets, Wind, Armchair, DoorOpen, Paintbrush, Grid2X2,
  Layers3, House, Construction, Wrench, Trees, PanelsTopLeft, Lightbulb,
  Bath, Hammer, Wallpaper, Blinds, ShieldCheck, Plug, Package
} from 'lucide-react'

// Official WakaStore merchant taxonomy (30 categories). Water tank and water
// pump merchant categories are intentionally excluded from this list.
const definitions = [
  ['Cement Merchant', Blocks, 'Cement and cement-based building materials'],
  ['Sand Merchant', Construction, 'Sharp sand, plaster sand and filling sand'],
  ['Chippings/Granite Merchant', Construction, 'Granite, chippings and aggregates'],
  ['Blocks Merchant', Blocks, 'Hollow, solid and paving blocks'],
  ['Iron Rods & Reinforcement Materials Merchant', Construction, 'Rebars, binding wire and reinforcement'],
  ['Timber Merchant', Trees, 'Timber, planks and treated wood'],
  ['Plywood & Board Merchant', PanelsTopLeft, 'Plywood and general-purpose boards'],
  ['Roofing Materials & Accessories Merchant', House, 'Roof sheets, trusses and accessories'],
  ['Electrical Materials Merchant', Plug, 'Cables, conduits and electrical supplies'],
  ['Lighting & Light Fittings Merchant', Lightbulb, 'Lamps, fittings and lighting accessories'],
  ['Plumbing Materials Merchant', Droplets, 'Pipes, fittings, valves and plumbing supplies'],
  ['Sanitary Ware Merchant', Bath, 'Toilets, basins, taps and bathroom fixtures'],
  ['Tiles Merchant', Grid2X2, 'Ceramic, porcelain and floor tiles'],
  ['Marble & Granite Merchant', Layers3, 'Marble, granite and stone slabs'],
  ['Tile Adhesive & Grout Merchant', Package, 'Tile adhesives, grout and installation materials'],
  ['Paint Merchant', Paintbrush, 'Interior, exterior and protective paints'],
  ['Screeding & Wall Finishes Materials Merchant', Layers3, 'Screeding, fillers and wall finishes'],
  ['POP & Gypsum Materials Merchant', Layers3, 'POP, gypsum and plasterboard materials'],
  ['Ceiling Materials Merchant', PanelsTopLeft, 'Ceiling boards, channels and accessories'],
  ['Doors, Locks & Hardware Merchant', DoorOpen, 'Doors, locks, hinges and door hardware'],
  ['Aluminium Materials Merchant', Construction, 'Aluminium profiles and accessories'],
  ['Glass Merchant', PanelsTopLeft, 'Glass sheets and glazing materials'],
  ['Steel, Metal & Welding Materials Merchant', Construction, 'Steel sections, metal and welding supplies'],
  ['MDF & Furniture Board Merchant', Armchair, 'MDF, melamine and furniture boards'],
  ['Furniture Fittings & Accessories Merchant', Wrench, 'Hinges, handles, runners and fittings'],
  ['Wallpaper & Wall Panel Merchant', Wallpaper, 'Wallpaper, decorative and wall panels'],
  ['Curtains & Blinds Merchant', Blinds, 'Curtains, blinds and window accessories'],
  ['General Hardware Merchant', Hammer, 'Tools, fasteners and general hardware'],
  ['Sealants, Silicone & Adhesives Merchant', ShieldCheck, 'Sealants, silicone and construction adhesives'],
  ['Pest Control & Fumigation Supplies Merchant', Wind, 'Pest control and fumigation supplies']
]

// Relationship between the 30 merchant categories and the 12 customer-facing
// categories. Every merchant category belongs to exactly one customer category.
// (No merchant category currently maps to "AC & HVAC".)
export const MERCHANT_TO_CUSTOMER_CATEGORY = {
  'Cement Merchant': 'Building Materials',
  'Sand Merchant': 'Building Materials',
  'Chippings/Granite Merchant': 'Building Materials',
  'Blocks Merchant': 'Building Materials',
  'Iron Rods & Reinforcement Materials Merchant': 'Steel, Aluminium & Metal',
  'Timber Merchant': 'Wood & Furniture Materials',
  'Plywood & Board Merchant': 'Wood & Furniture Materials',
  'Roofing Materials & Accessories Merchant': 'Roofing & Waterproofing',
  'Electrical Materials Merchant': 'Electrical & Lighting',
  'Lighting & Light Fittings Merchant': 'Electrical & Lighting',
  'Plumbing Materials Merchant': 'Plumbing & Sanitary',
  'Sanitary Ware Merchant': 'Plumbing & Sanitary',
  'Tiles Merchant': 'Tiles & Flooring',
  'Marble & Granite Merchant': 'Tiles & Flooring',
  'Tile Adhesive & Grout Merchant': 'Building Materials',
  'Paint Merchant': 'Paints & Wall Finishes',
  'Screeding & Wall Finishes Materials Merchant': 'Paints & Wall Finishes',
  'POP & Gypsum Materials Merchant': 'Ceiling, POP & Partition',
  'Ceiling Materials Merchant': 'Ceiling, POP & Partition',
  'Doors, Locks & Hardware Merchant': 'Doors, Windows & Hardware',
  'Aluminium Materials Merchant': 'Steel, Aluminium & Metal',
  'Glass Merchant': 'Doors, Windows & Hardware',
  'Steel, Metal & Welding Materials Merchant': 'Steel, Aluminium & Metal',
  'MDF & Furniture Board Merchant': 'Wood & Furniture Materials',
  'Furniture Fittings & Accessories Merchant': 'Wood & Furniture Materials',
  'Wallpaper & Wall Panel Merchant': 'Paints & Wall Finishes',
  'Curtains & Blinds Merchant': 'Doors, Windows & Hardware',
  'General Hardware Merchant': 'General Hardware & Consumables',
  'Sealants, Silicone & Adhesives Merchant': 'General Hardware & Consumables',
  'Pest Control & Fumigation Supplies Merchant': 'General Hardware & Consumables',
}

export const categories = definitions.map(([name, icon, description], index) => ({
  id: index + 1,
  name,
  icon,
  description,
  customerCategory: MERCHANT_TO_CUSTOMER_CATEGORY[name],
}))

export const MERCHANT_CATEGORY_NAMES = categories.map(({ name }) => name)
