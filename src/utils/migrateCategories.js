import { MERCHANT_CATEGORY_NAMES } from "../constants/categories.js";

// Older saved demo data used a previous 12-group shopper taxonomy. Map it onto
// the 30 official WakaStore categories so nothing in localStorage points at a
// category that no longer exists. Safe to run on every load (already-valid
// names pass through untouched).
const LEGACY_CATEGORY_MAP = {
  "Building Materials": "Cement Merchant",
  "Electrical & Lighting": "Electrical Materials Merchant",
  "Plumbing & Sanitary": "Plumbing Materials Merchant",
  "AC & HVAC": "General Hardware Merchant",
  "Wood & Furniture Materials": "Timber Merchant",
  "Doors, Windows & Hardware": "Doors, Locks & Hardware Merchant",
  "Paints & Wall Finishes": "Paint Merchant",
  "Tiles & Flooring": "Tiles Merchant",
  "Ceiling, POP & Partition": "Ceiling Materials Merchant",
  "Roofing & Waterproofing": "Roofing Materials & Accessories Merchant",
  "Steel, Aluminium & Metal": "Iron Rods & Reinforcement Materials Merchant",
  "General Hardware & Consumables": "General Hardware Merchant",
};

export const migrateCategory = (category, name = "") => {
  if (MERCHANT_CATEGORY_NAMES.includes(category)) return category;
  const n = String(name).toLowerCase();
  if (category === "Building Materials" && n.includes("adhesive")) return "Tile Adhesive & Grout Merchant";
  if (category === "Tiles & Flooring" && n.includes("granite")) return "Marble & Granite Merchant";
  return LEGACY_CATEGORY_MAP[category] || category;
};

export const migrateCategories = (state) => {
  if (!state || typeof state !== "object") return state;
  return {
    ...state,
    products: (state.products || []).map((p) => {
      const category = migrateCategory(p.category, p.name);
      return category === p.category ? p : { ...p, category };
    }),
    merchants: (state.merchants || []).map((m) =>
      Array.isArray(m.categories)
        ? { ...m, categories: [...new Set(m.categories.map((c) => migrateCategory(c)))] }
        : m
    ),
  };
};
