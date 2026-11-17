import { homepageShelves } from "@/lib/server/listings";
import { CategorySidebar } from "./CategorySidebar";
import { HeroBanner } from "./HeroBanner";
import { ProductShelves } from "./ProductShelves";

/**
 * Top of the homepage: category menu on the left (desktop),
 * banner with search and the product shelves on the right.
 * (The previous "Find it fast" filters live in QuickFinder.tsx if we want them back.)
 */
export async function Discover() {
  const shelfData = await homepageShelves();

  return (
    <section className="container-x pt-4 sm:pt-6">
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CategorySidebar />
        <div className="flex min-w-0 flex-col gap-4">
          <HeroBanner />
          {shelfData ? <ProductShelves data={shelfData} /> : null}
        </div>
      </div>
    </section>
  );
}
