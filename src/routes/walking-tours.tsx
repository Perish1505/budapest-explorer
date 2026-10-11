import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { TourCatalog } from "@/components/site/TourCatalog";

export const Route = createFileRoute("/walking-tours")({
  head: () => ({
    meta: [
      { title: "Walking Tours in Budapest — Budapest Explorer" },
      { name: "description", content: "Guided walking tours of Budapest: Castle District, Jewish Quarter, city highlights and hidden gems." },
      { property: "og:title", content: "Budapest Walking Tours" },
      { property: "og:description", content: "Explore Budapest on foot with a local guide." },
    ],
  }),
  component: () => (
    <>
      <PageHero image="/images/tour-castle.jpg" eyebrow="Walking tours" title="Budapest on foot" subtitle="Historic neighbourhoods, grand architecture and hidden courtyards — at walking pace." />
      <TourCatalog initial={{}} lockType="walking" />
    </>
  ),
});
