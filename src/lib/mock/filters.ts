/**
 * Filter options for the Quick Finder and the category menu.
 * Brand lists match the Laravel CategorySeeder; later they come from the API.
 */

const PHONE_BRANDS = ["Apple", "Samsung", "Tecno", "Infinix", "itel", "Xiaomi", "Redmi", "Oppo", "Vivo", "Realme", "Google Pixel", "OnePlus", "Nokia", "Huawei"];
const TABLET_BRANDS = ["Apple", "Samsung", "Lenovo", "Xiaomi", "Huawei", "Amazon"];
const LAPTOP_BRANDS = ["Apple", "HP", "Dell", "Lenovo", "Asus", "Acer", "Microsoft", "Samsung", "Toshiba"];
const TV_BRANDS = ["Samsung", "LG", "Hisense", "Sony", "TCL", "Polystar", "Scanfrost"];

/** Brands per sub-category slug. Categories not listed here have no brand filter. */
export const brandsBySubcategory: Record<string, string[]> = {
  "mobile-phones": PHONE_BRANDS,
  tablets: TABLET_BRANDS,
  laptops: LAPTOP_BRANDS,
  tvs: TV_BRANDS,
};

export type PricePreset = { label: string; min?: number; max?: number }; // naira

export const pricePresets: PricePreset[] = [
  { label: "Under ₦50k", max: 50_000 },
  { label: "₦50k – ₦200k", min: 50_000, max: 200_000 },
  { label: "₦200k – ₦500k", min: 200_000, max: 500_000 },
  { label: "Above ₦500k", min: 500_000 },
];

export const conditions = [
  { value: "brand_new", label: "Brand new" },
  { value: "foreign_used", label: "Foreign used" },
  { value: "nigerian_used", label: "Nigerian used" },
  { value: "refurbished", label: "Refurbished" },
  { value: "faulty", label: "Faulty (for parts)" },
];
