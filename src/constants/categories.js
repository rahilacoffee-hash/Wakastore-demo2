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

export const categories = definitions.map(([name, icon, description], index) => ({
  id: index + 1,
  name,
  icon,
  description
}))

export const MERCHANT_CATEGORY_NAMES = categories.map(({ name }) => name)
