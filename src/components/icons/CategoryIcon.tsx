import type { CategoryIconName } from "@/lib/mock/categories";
import { cn } from "@/lib/utils";

const paths: Record<CategoryIconName, React.ReactNode> = {
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1.75" />
      <path d="M2.5 19.5h19" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8.5 20.5h7M12 17v3.5" />
    </>
  ),
  bolt: <path d="M13.2 2.75 5.5 13.25h6l-1.2 8 7.7-10.5h-6l1.2-8Z" strokeLinejoin="round" />,
  home: (
    <>
      <path d="M3.5 10.5 12 3.75l8.5 6.75" strokeLinejoin="round" />
      <path d="M5.75 9v11.25h12.5V9" strokeLinejoin="round" />
      <path d="M10 20.25v-5.5h4v5.5" />
    </>
  ),
  shirt: (
    <path
      d="M8.5 3.5 4 6l1.5 4.25 2.25-.75v11h8.5v-11l2.25.75L20 6l-4.5-2.5c-.4 1.6-1.85 2.75-3.5 2.75S8.9 5.1 8.5 3.5Z"
      strokeLinejoin="round"
    />
  ),
  book: (
    <>
      <path d="M4.5 5.25c0-1 .8-1.75 1.75-1.75H19.5v15.25H6.25c-1 0-1.75.8-1.75 1.75" strokeLinejoin="round" />
      <path d="M4.5 5.25v15.25c0-.95.8-1.75 1.75-1.75" />
      <path d="M9 8h6.5" />
    </>
  ),
  backpack: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0v11H6v-11Z" strokeLinejoin="round" />
      <path d="M9.5 3.75h5M9 14.5h6v6H9z" strokeLinejoin="round" />
    </>
  ),
};

export function CategoryIcon({ name, className }: { name: CategoryIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}
