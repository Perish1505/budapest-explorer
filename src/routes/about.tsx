import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/PageHero";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Budapest Explorer" },
      { name: "description", content: "About Us for Budapest Explorer walking and cycling tours." },
      { property: "og:title", content: "About Us — Budapest Explorer" },
      { property: "og:description", content: "About Us for Budapest Explorer tours." },
    ],
  }),
  component: () => (
    <>
      <PageHero title="About Us" />
      <Prose><p>Budapest Explorer is a small team of local guides running walking and cycling tours in our home city. We keep groups small, routes thoughtful and prices transparent.</p></Prose>
    </>
  ),
});
