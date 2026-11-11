import { categories } from "./categories.js";

// Shopper-facing categories are the SAME 30 official WakaStore merchant
// categories (src/constants/categories.js is the single source of truth).
// Products, filters, the Home strip and the Explore page all use these exact
// names, so a merchant's category always matches what shoppers browse.
const SHORT_LABELS = {
  "Chippings/Granite Merchant": "Chippings & Granite",
  "Iron Rods & Reinforcement Materials Merchant": "Iron Rods",
  "Roofing Materials & Accessories Merchant": "Roofing",
  "Screeding & Wall Finishes Materials Merchant": "Wall Finishes",
  "POP & Gypsum Materials Merchant": "POP & Gypsum",
  "Steel, Metal & Welding Materials Merchant": "Steel & Welding",
  "Furniture Fittings & Accessories Merchant": "Furniture Fittings",
  "Sealants, Silicone & Adhesives Merchant": "Sealants",
  "Pest Control & Fumigation Supplies Merchant": "Pest Control",
  "Tile Adhesive & Grout Merchant": "Adhesive & Grout",
  "Doors, Locks & Hardware Merchant": "Doors & Locks",
  "Lighting & Light Fittings Merchant": "Lighting",
  "MDF & Furniture Board Merchant": "MDF & Boards",
  "Wallpaper & Wall Panel Merchant": "Wallpaper",
};

const shortLabel = (name) =>
  SHORT_LABELS[name] || name.replace(/ Materials Merchant$/, "").replace(/ Merchant$/, "");

export const MARKET_CATEGORIES = categories.map(({ name, icon, description }) => ({
  name,
  short: shortLabel(name),
  icon,
  description,
}));

export const MARKET_CATEGORY_NAMES = MARKET_CATEGORIES.map((c) => c.name);
