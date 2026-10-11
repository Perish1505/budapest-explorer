import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { TourCatalog } from "@/components/site/TourCatalog";

export const Route = createFileRoute("/cycling-tours")({
  head: () => ({
    meta: [
      { title: "Cycling Tours in Budapest — Budapest Explorer" },
      { name: "description", content: "Guided bike tours of Budapest along the Danube, Margaret Island, the Buda Hills and at sunset." },
      { property: "og:title", content: "Budapest Cycling Tours" },
      { property: "og:description", content: "Ride the Danube, parks and hills with a local guide." },
    ],
  }),
  component: () => (
    <>
      <PageHero image="/images/tour-danube.jpg" eyebrow="Cycling tours" title="Budapest by bike" subtitle="Riverside paths, car-free islands and views from the hills. Bikes and helmets included." />
      <TourCatalog initial={{}} lockType="cycling" />
    </>
  ),
});
