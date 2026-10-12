import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/PageHero";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Budapest Explorer" },
      { name: "description", content: "Terms and Conditions for Budapest Explorer walking and cycling tours." },
      { property: "og:title", content: "Terms and Conditions — Budapest Explorer" },
      { property: "og:description", content: "Terms and Conditions for Budapest Explorer tours." },
    ],
  }),
  component: () => (
    <>
      <PageHero title="Terms and Conditions" />
      <Prose><p>By booking you agree to arrive on time at the meeting point and follow your guide's safety instructions. Cycling participants must be able to ride confidently.</p></Prose>
    </>
  ),
});
