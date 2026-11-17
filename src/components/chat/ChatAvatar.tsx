import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** A person's photo, or their initials on ink. Optional green dot when online. */
export function ChatAvatar({
  name,
  url,
  online = false,
  className,
}: {
  name: string;
  url: string | null;
  online?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex h-10 w-10 shrink-0", className)}>
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-ink text-xs font-bold text-white">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initials(name)
        )}
      </span>
      {online ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-brand-400 ring-2 ring-card" aria-label="Online" />
      ) : null}
    </span>
  );
}
