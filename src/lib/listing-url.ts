/** Item page links look like /item/iphone-13-pro-256gb-01jd8xq1a9f3k2m7p4r6t8v0w1 */

export function listingHref(listing: { slug: string; id: string }) {
  return `/item/${listing.slug}-${listing.id}`;
}

/** The ID is always the last 26 characters (a ULID). */
export function idFromSlugId(slugId: string): string {
  return slugId.slice(-26);
}
