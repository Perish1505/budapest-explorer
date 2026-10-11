import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageHero } from "@/components/site/PageHero";
import { TourCatalog } from "@/components/site/TourCatalog";

const search = z.object({
  type: z.enum(["walking", "cycling"]).optional().catch(undefined),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  people: z.coerce.number().int().min(1).max(50).optional().catch(undefined),
  q: z.string().max(100).optional().catch(undefined),
});

export const Route = createFileRoute("/tours/")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "All Tours — Budapest Explorer" },
      { name: "description", content: "Browse every walking and cycling tour in Budapest. Filter by date, price, duration, difficulty and language." },
      { property: "og:title", content: "All Budapest Walking & Cycling Tours" },
      { property: "og:description", content: "Filter tours by date, price, duration and difficulty, then book online." },
    ],
  }),
  component: ToursPage,
});

function ToursPage() {
  const s = Route.useSearch();
  return (
    <>
      <PageHero eyebrow="All tours" title="Find your Budapest tour" subtitle="Walking or cycling, morning or sunset — filter by what matters to you." />
      <TourCatalog key={JSON.stringify(s)} initial={s} />
    </>
  );
}
