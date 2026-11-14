import {
  Blocks, Plug, Droplets, Wind, Armchair, DoorOpen, Paintbrush, Grid2X2,
  PanelsTopLeft, House, Construction, Hammer,
} from "lucide-react";
import { MERCHANT_TO_CUSTOMER_CATEGORY } from "./categories.js";
import { migrateCategory } from "../utils/migrateCategories.js";

// The 12 customer-facing categories shown to shoppers (Home, Explore,
// Categories). Merchants and products use the 30 official merchant categories
// (constants/categories.js); each of those maps to exactly one of these 12.
export const MARKET_CATEGORIES = [
  { name: "Building Materials", short: "Building", icon: Blocks, description: "Cement, sand, granite, blocks and adhesives" },
  { name: "Electrical & Lighting", short: "Electrical", icon: Plug, description: "Cables, conduits, switches, lamps and fittings" },
  { name: "Plumbing & Sanitary", short: "Plumbing", icon: Droplets, description: "Pipes, fittings, taps and bathroom fixtures" },
  { name: "AC & HVAC", short: "AC & HVAC", icon: Wind, description: "Air conditioners, ducting and ventilation" },
  { name: "Wood & Furniture Materials", short: "Wood", icon: Armchair, description: "Timber, plywood, MDF and furniture fittings" },
  { name: "Doors, Windows & Hardware", short: "Doors", icon: DoorOpen, description: "Doors, locks, glass and window treatments" },
  { name: "Paints & Wall Finishes", short: "Paints", icon: Paintbrush, description: "Paints, screeding, wallpaper and wall panels" },
  { name: "Tiles & Flooring", short: "Tiles", icon: Grid2X2, description: "Ceramic, porcelain, marble and floor tiles" },
  { name: "Ceiling, POP & Partition", short: "Ceiling", icon: PanelsTopLeft, description: "POP, gypsum, ceiling boards and partitions" },
  { name: "Roofing & Waterproofing", short: "Roofing", icon: House, description: "Roof sheets, accessories and waterproofing" },
  { name: "Steel, Aluminium & Metal", short: "Steel", icon: Construction, description: "Iron rods, steel, aluminium and welding supplies" },
  { name: "General Hardware & Consumables", short: "Hardware", icon: Hammer, description: "Tools, sealants, fasteners and site consumables" },
];

export const MARKET_CATEGORY_NAMES = MARKET_CATEGORIES.map((c) => c.name);

// Customer-facing category (one of the 12) of a product or category string.
// Products store a merchant category (one of the 30); leftover old names are
// first migrated onto the 30 by the same routine used when saved state loads.
export const marketCategoryOf = (productOrCategory) => {
  const product = typeof productOrCategory === "string" ? { category: productOrCategory } : productOrCategory || {};
  if (MARKET_CATEGORY_NAMES.includes(product.category)) return product.category;
  const merchantCategory = migrateCategory(product.category, product.name);
  return MERCHANT_TO_CUSTOMER_CATEGORY[merchantCategory] || "General Hardware & Consumables";
};
