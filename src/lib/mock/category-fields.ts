/**
 * The extra fields sellers fill per sub-category.
 * Mirrors the Laravel CategorySeeder; later it comes from GET /api/categories/{slug}/fields.
 */

export type FieldType = "text" | "number" | "select" | "boolean";

export type CategoryField = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
};

const PHONE_BRANDS = ["Apple", "Samsung", "Tecno", "Infinix", "itel", "Xiaomi", "Redmi", "Oppo", "Vivo", "Realme", "Google Pixel", "OnePlus", "Nokia", "Huawei", "Other"];
const STORAGE = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];
const PHONE_RAM = ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"];
const LAPTOP_BRANDS = ["Apple", "HP", "Dell", "Lenovo", "Asus", "Acer", "Microsoft", "Samsung", "Toshiba", "Other"];
const PROCESSORS = [
  "Intel Celeron / Pentium", "Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "Intel Core Ultra",
  "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9", "Apple M1", "Apple M2", "Apple M3", "Apple M4", "Other",
];
const LAPTOP_RAM = ["4GB", "8GB", "12GB", "16GB", "24GB", "32GB", "64GB"];
const LAPTOP_STORAGE = ["128GB", "256GB", "512GB", "1TB", "2TB"];

const sel = (key: string, label: string, options: string[], required = false): CategoryField => ({ key, label, type: "select", options, required });
const txt = (key: string, label: string, required = false): CategoryField => ({ key, label, type: "text", required });
const num = (key: string, label: string, required = false): CategoryField => ({ key, label, type: "number", required });
const bool = (key: string, label: string): CategoryField => ({ key, label, type: "boolean" });

export const categoryFields: Record<string, CategoryField[]> = {
  "mobile-phones": [
    sel("brand", "Brand", PHONE_BRANDS, true),
    txt("model", "Model (e.g. iPhone 13 Pro)", true),
    sel("storage", "Storage", STORAGE, true),
    sel("ram", "RAM", PHONE_RAM),
    num("battery_health", "Battery health (%)"),
    txt("colour", "Colour"),
    bool("dual_sim", "Dual SIM"),
  ],
  tablets: [
    sel("brand", "Brand", ["Apple", "Samsung", "Lenovo", "Xiaomi", "Huawei", "Amazon", "Other"], true),
    txt("model", "Model (e.g. iPad Air 5)", true),
    sel("storage", "Storage", STORAGE, true),
    sel("connectivity", "Connectivity", ["Wi-Fi only", "Wi-Fi + Cellular"]),
  ],
  "phone-tablet-accessories": [
    sel("type", "Type", ["Charger", "Power bank", "Earbuds / Headphones", "Smartwatch", "Phone case", "Screen protector", "Cable", "Other"], true),
    txt("brand", "Brand"),
  ],
  laptops: [
    sel("brand", "Brand", LAPTOP_BRANDS, true),
    txt("model", "Model (e.g. HP EliteBook 840 G5)", true),
    sel("processor", "Processor", PROCESSORS, true),
    sel("ram", "RAM", LAPTOP_RAM, true),
    sel("storage", "Storage", LAPTOP_STORAGE, true),
    sel("storage_type", "Storage type", ["SSD", "HDD", "SSD + HDD"]),
    num("screen_size", "Screen size (inches)"),
    bool("touchscreen", "Touchscreen"),
  ],
  "desktops-monitors": [
    sel("type", "Type", ["Desktop", "All-in-one", "Monitor", "Mac mini / Mac Studio"], true),
    txt("brand", "Brand"),
    sel("processor", "Processor", PROCESSORS),
    sel("ram", "RAM", LAPTOP_RAM),
    num("screen_size", "Screen size (inches)"),
  ],
  "computer-accessories": [
    sel("type", "Type", ["Keyboard", "Mouse", "Laptop bag", "Charger", "External drive / Flash", "Printer", "Router / MiFi", "UPS", "Other"], true),
    txt("brand", "Brand"),
  ],
  tvs: [
    sel("brand", "Brand", ["Samsung", "LG", "Hisense", "Sony", "TCL", "Polystar", "Scanfrost", "Other"], true),
    num("screen_size", "Screen size (inches)", true),
    bool("smart_tv", "Smart TV"),
  ],
  "speakers-sound-systems": [
    sel("type", "Type", ["Bluetooth speaker", "Soundbar", "Home theatre", "Sound system", "Other"], true),
    txt("brand", "Brand"),
  ],
  "video-games-consoles": [
    sel("type", "Type", ["Console", "Game", "Controller", "Accessory"], true),
    sel("platform", "Platform", ["PlayStation 5", "PlayStation 4", "Xbox Series X|S", "Xbox One", "Nintendo Switch", "PC", "Other"], true),
  ],
  cameras: [sel("type", "Type", ["DSLR", "Mirrorless", "Action camera", "Lens", "Drone", "Accessory"], true), txt("brand", "Brand")],
  generators: [
    txt("brand", "Brand", true),
    num("capacity_kva", "Capacity (kVA)", true),
    sel("fuel_type", "Fuel type", ["Petrol", "Diesel", "Gas", "Dual fuel"], true),
    bool("soundproof", "Soundproof"),
  ],
  "inverters-batteries": [
    sel("type", "Type", ["Inverter", "Battery", "Inverter + battery set", "Power station"], true),
    num("capacity_kva", "Capacity (kVA)"),
    sel("battery_type", "Battery type", ["Lithium", "Tubular", "Gel / AGM", "Not applicable"]),
    txt("brand", "Brand"),
  ],
  "solar-panels": [
    num("wattage", "Wattage per panel (W)", true),
    sel("panel_type", "Panel type", ["Monocrystalline", "Polycrystalline", "Not sure"]),
    num("quantity_in_set", "Panels in this listing"),
  ],
  "kitchen-appliances": [sel("type", "Type", ["Fridge", "Freezer", "Microwave", "Blender", "Gas cooker", "Oven", "Air fryer", "Other"], true), txt("brand", "Brand")],
  appliances: [
    sel("type", "Type", ["Air conditioner", "Washing machine", "Fan", "Rechargeable fan / lamp", "Iron", "Water dispenser", "Vacuum cleaner", "Other"], true),
    txt("brand", "Brand"),
  ],
  "kitchenware-decor": [txt("type", "What is it?", true)],
  furniture: [sel("type", "Type", ["Bed", "Mattress", "Sofa", "Chair", "Table", "Wardrobe", "Shelf", "Office furniture", "Other"], true), txt("material", "Material")],
  "mens-fashion": [sel("type", "Type", ["Clothing", "Native wear", "Shoes", "Watches", "Bags", "Accessories"], true), txt("size", "Size"), txt("brand", "Brand")],
  "womens-fashion": [sel("type", "Type", ["Clothing", "Native wear", "Shoes", "Bags", "Jewellery", "Watches", "Accessories"], true), txt("size", "Size"), txt("brand", "Brand")],
  "hair-wigs": [
    sel("type", "Type", ["Wig", "Hair extensions / Bundles", "Hair products"], true),
    sel("hair_type", "Hair type", ["Human hair", "Synthetic", "Blend"]),
    num("length_inches", "Length (inches)"),
  ],
  "beauty-personal-care": [sel("type", "Type", ["Skincare", "Makeup", "Fragrance", "Hair care", "Grooming", "Other"], true), txt("brand", "Brand")],
  textbooks: [txt("author", "Author"), txt("edition", "Edition"), txt("course_code", "Course code (e.g. CSC 201)"), txt("institution", "School / Institution"), txt("isbn", "ISBN")],
  "novels-general-books": [txt("author", "Author"), sel("genre", "Genre", ["Fiction", "Non-fiction", "Christian / Religious", "Business & Finance", "Self-help", "Children", "Other"])],
  "past-questions-study-materials": [txt("institution", "School / Exam (e.g. FUTA, JAMB, WAEC)", true), txt("course_code", "Course / Subject"), txt("year", "Year(s)")],
  "hostel-essentials": [sel("type", "Type", ["Mattress", "Reading table / Chair", "Rechargeable lamp / Fan", "Cooking items", "Storage box", "Other"], true)],
  "baby-gear": [sel("type", "Type", ["Stroller", "Car seat", "Cot / Crib", "Walker", "Baby carrier", "Other"], true), txt("brand", "Brand")],
  "kids-clothing-toys": [sel("type", "Type", ["Clothing", "Shoes", "Toys", "School items"], true), txt("age_range", "Age range (e.g. 3-5 years)")],
};
