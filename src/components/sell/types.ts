/** A photo in the form: a new upload (file), or one already on the ad (existingId) when editing. */
export type SellPhoto = { id: string; file: File | null; url: string; existingId?: number };

export type SellForm = {
  rootCategory: string;
  category: string;
  photos: SellPhoto[];
  title: string;
  condition: string;
  specs: Record<string, string>;
  description: string;
  price: string; // digits only, naira
  negotiable: boolean;
  quantity: string;
  state: string; // slug
  city: string;
  delivery: { meetup: boolean; seller_delivery: boolean };
};

export const emptyForm: SellForm = {
  rootCategory: "",
  category: "",
  photos: [],
  title: "",
  condition: "",
  specs: {},
  description: "",
  price: "",
  negotiable: true,
  quantity: "1",
  state: "",
  city: "",
  delivery: { meetup: true, seller_delivery: false },
};

export type Errors = Partial<Record<string, string>>;

export const MAX_PHOTOS = 10;
export const MAX_PHOTO_MB = 10;
export const TITLE_MAX = 120;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 2000;

export const fieldClass =
  "h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 text-[15px] text-ink placeholder:text-subtle transition-colors hover:border-ink/25 focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5";

export const labelClass = "mb-1.5 block text-sm font-semibold text-ink";
