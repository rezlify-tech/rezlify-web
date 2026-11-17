import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * For now, category links open the search page filtered to that category.
 * Later this becomes a proper category page for Google.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { brand } = await searchParams;

  const qs = new URLSearchParams({ category: slug });
  if (typeof brand === "string" && brand) qs.set("brand", brand);

  redirect(`/search?${qs.toString()}`);
}
