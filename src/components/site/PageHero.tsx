import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, subtitle, image }: { eyebrow?: string; title: string; subtitle?: ReactNode; image?: string }) {
  if (image) {
    return (
      <section className="relative isolate overflow-hidden">
        <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="container-page py-24 text-primary-foreground md:py-32">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold md:text-6xl">{title}</h1>
          {subtitle && <p className="mt-4 max-w-2xl text-lg text-primary-foreground/85">{subtitle}</p>}
        </div>
      </section>
    );
  }
  return (
    <section className="border-b border-border bg-sand/60">
      <div className="container-page py-14 md:py-20">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-primary md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="container-page max-w-3xl space-y-5 py-14 leading-relaxed text-foreground/85 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-primary [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</div>;
}
