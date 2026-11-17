import { ParticleField } from "@/components/home/ParticleField";

/**
 * Page background used on focused pages (sign in, posting): soft green glows plus the
 * interactive particle field, faded in the centre so forms stay easy to read.
 * Put it inside a `relative isolate` container.
 */
export function ParticleBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -right-32 -top-40 h-[520px] w-[680px] rounded-full bg-[radial-gradient(closest-side,var(--color-brand-100),transparent)]" />
      <div className="absolute -bottom-48 -left-32 h-[460px] w-[620px] rounded-full bg-[radial-gradient(closest-side,var(--color-brand-50),transparent)]" />
      <div
        className="absolute inset-0"
        style={{
          maskImage: "radial-gradient(ellipse 34% 48% at 50% 50%, rgb(0 0 0 / 0.12), #000 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 34% 48% at 50% 50%, rgb(0 0 0 / 0.12), #000 80%)",
        }}
      >
        <ParticleField colorVar="--color-brand-500" />
      </div>
    </div>
  );
}
