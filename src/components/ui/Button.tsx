import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "buy" | "dark" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-[0_1px_0_rgb(255_255_255/0.2)_inset]",
  // Only for Buy now, so it always stands out.
  buy: "bg-amber-500 text-ink hover:bg-amber-400 shadow-[0_1px_0_rgb(255_255_255/0.35)_inset]",
  dark: "bg-ink text-white hover:bg-ink-3",
  outline: "border border-line-strong bg-card text-ink hover:border-ink/30 hover:bg-sand",
  ghost: "text-ink hover:bg-sand",
  danger: "bg-danger-500 text-white hover:bg-danger-600",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-6 text-base",
};

type Common = {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type ButtonProps = Common & Omit<ComponentProps<"button">, keyof Common>;
type LinkProps = Common & { href: string } & Omit<ComponentProps<typeof Link>, keyof Common | "href">;

export function buttonClass({ variant = "primary", size = "md", block, className }: Common = {}) {
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

function Content({ loading, icon, children }: Pick<Common, "loading" | "icon" | "children">) {
  return (
    <>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
      ) : (
        icon
      )}
      {children}
    </>
  );
}

export function Button({ variant, size, block, loading, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, block, className })}
      {...rest}
    >
      <Content loading={loading} icon={icon}>
        {children}
      </Content>
    </button>
  );
}

export function ButtonLink({ variant, size, block, loading, icon, className, children, href, ...rest }: LinkProps) {
  return (
    <Link href={href} className={buttonClass({ variant, size, block, className })} {...rest}>
      <Content loading={loading} icon={icon}>
        {children}
      </Content>
    </Link>
  );
}
