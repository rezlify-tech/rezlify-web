import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

const drop = "animate-[item-drop_6s_cubic-bezier(0.45,0,0.2,1)_infinite_both]";

/**
 * The mark: a shopping cart catching items one after another (a phone, a shirt,
 * a gold coin and a book) on a 6s loop. The cart dips a little as each one lands,
 * and rolls forward on hover. Colours come from the theme.
 * Use tone="dark" on dark backgrounds (cart and phone turn white).
 */
export function LogoMark({ className, tone = "light", title = site.name }: { className?: string; tone?: Tone; title?: string }) {
  const dark = tone === "dark";
  const cart = dark ? "#ffffff" : "var(--color-primary)";
  const phone = dark ? "#ffffff" : "var(--color-ink)";
  const box = { transformBox: "fill-box", transformOrigin: "center" } as const;

  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 overflow-visible", className)} role="img" aria-label={title}>
      {/* Items, each dropping in its own slot of the cycle */}
      <g className={drop} style={{ ...box, animationDelay: "0s" }}>
        <rect x="15.1" y="2.4" width="5" height="9" rx="1.25" fill={phone} />
        <rect x="15.9" y="3.4" width="3.4" height="6.2" rx="0.6" fill="var(--color-brand-200)" />
      </g>

      <g className={drop} style={{ ...box, animationDelay: "1.5s" }}>
        <path
          d="M15.4 3.2 13.1 4.4l.9 2.2 1.2-.4v5h5.6v-5l1.2.4.9-2.2-2.3-1.2c-.3.9-1.2 1.5-2.1 1.5s-1.8-.6-2.1-1.5Z"
          fill="var(--color-brand-400)"
        />
      </g>

      <g className={drop} style={{ ...box, animationDelay: "3s" }}>
        <circle cx="17.6" cy="7" r="3.6" fill="var(--color-coin)" />
        <circle cx="17.6" cy="7" r="2.1" fill="none" stroke="var(--color-coin-dark)" strokeWidth="1.1" />
      </g>

      <g className={drop} style={{ ...box, animationDelay: "4.5s" }}>
        <rect x="14.4" y="3" width="6.4" height="8" rx="0.9" fill="var(--color-coin-dark)" />
        <rect x="15.6" y="3" width="1.1" height="8" fill="#ffffff" opacity="0.55" />
        <path d="M17.6 5.3h2" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
      </g>

      {/* Cart: rolls forward on hover (outer), dips as items land (inner) */}
      <g className="group-hover:animate-[cart-nudge_0.6s_ease-in-out_2]" style={box}>
        <g className="animate-[cart-catch_1.5s_ease-in-out_infinite]" style={box}>
          <path
            d="M3.5 6.5h3.2l2.7 12.3a2 2 0 0 0 1.96 1.57h10.4a2 2 0 0 0 1.94-1.5L26.8 11H8"
            fill="none"
            stroke={cart}
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12.6" cy="25.4" r="2.3" fill={cart} />
          <circle cx="22.2" cy="25.4" r="2.3" fill={cart} />
        </g>
      </g>
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  tone = "light",
}: {
  className?: string;
  markClassName?: string;
  tone?: Tone;
}) {
  return (
    <span className={cn("group inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} tone={tone} />
      <span
        className={cn(
          "text-[22px] font-extrabold leading-none tracking-[-0.03em]",
          tone === "dark" ? "text-white" : "text-ink",
        )}
      >
        {site.wordmark}
      </span>
    </span>
  );
}
