/**
 * Mock data shaped like the Laravel categories table.
 * Swapped for the real API later (counts will come from live listings).
 */

export type CategoryIconName = "phone" | "laptop" | "tv" | "bolt" | "home" | "shirt" | "book" | "backpack";

export type SubCategory = {
  name: string;
  slug: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  icon: CategoryIconName;
  listingCount: number;
  children: SubCategory[];
};

export const rootCategories: Category[] = [
  {
    id: 1,
    name: "Phones & Tablets",
    slug: "phones-tablets",
    icon: "phone",
    listingCount: 12480,
    children: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Tablets", slug: "tablets" },
      { name: "Accessories", slug: "phone-tablet-accessories" },
    ],
  },
  {
    id: 2,
    name: "Computers",
    slug: "computers",
    icon: "laptop",
    listingCount: 6215,
    children: [
      { name: "Laptops", slug: "laptops" },
      { name: "Desktops & Monitors", slug: "desktops-monitors" },
      { name: "Accessories", slug: "computer-accessories" },
    ],
  },
  {
    id: 3,
    name: "TV, Audio & Gaming",
    slug: "tv-audio-gaming",
    icon: "tv",
    listingCount: 4390,
    children: [
      { name: "TVs", slug: "tvs" },
      { name: "Speakers", slug: "speakers-sound-systems" },
      { name: "Gaming", slug: "video-games-consoles" },
      { name: "Cameras", slug: "cameras" },
    ],
  },
  {
    id: 4,
    name: "Power & Solar",
    slug: "power-solar",
    icon: "bolt",
    listingCount: 3870,
    children: [
      { name: "Generators", slug: "generators" },
      { name: "Inverters", slug: "inverters-batteries" },
      { name: "Solar Panels", slug: "solar-panels" },
    ],
  },
  {
    id: 5,
    name: "Home & Appliances",
    slug: "home-appliances",
    icon: "home",
    listingCount: 7105,
    children: [
      { name: "Kitchen", slug: "kitchen-appliances" },
      { name: "Appliances", slug: "appliances" },
      { name: "Furniture", slug: "furniture" },
      { name: "Kitchenware & Decor", slug: "kitchenware-decor" },
    ],
  },
  {
    id: 6,
    name: "Fashion & Beauty",
    slug: "fashion-beauty",
    icon: "shirt",
    listingCount: 9640,
    children: [
      { name: "Men", slug: "mens-fashion" },
      { name: "Women", slug: "womens-fashion" },
      { name: "Hair & Wigs", slug: "hair-wigs" },
      { name: "Beauty", slug: "beauty-personal-care" },
    ],
  },
  {
    id: 7,
    name: "Books & Education",
    slug: "books-education",
    icon: "book",
    listingCount: 2755,
    children: [
      { name: "Textbooks", slug: "textbooks" },
      { name: "Novels", slug: "novels-general-books" },
      { name: "Past Questions", slug: "past-questions-study-materials" },
    ],
  },
  {
    id: 8,
    name: "Students & Kids",
    slug: "students-kids",
    icon: "backpack",
    listingCount: 1980,
    children: [
      { name: "Hostel", slug: "hostel-essentials" },
      { name: "Baby Gear", slug: "baby-gear" },
      { name: "Kids & Toys", slug: "kids-clothing-toys" },
    ],
  },
];
