import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/PageHero";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — Budapest Explorer" },
      { name: "description", content: "Frequently Asked Questions for Budapest Explorer walking and cycling tours." },
      { property: "og:title", content: "Frequently Asked Questions — Budapest Explorer" },
      { property: "og:description", content: "Frequently Asked Questions for Budapest Explorer tours." },
    ],
  }),
  component: () => (
    <>
      <PageHero title="Frequently Asked Questions" />
      <Prose><h2>Do I need to print my ticket?</h2><p>No, your booking reference on your phone is enough.</p><h2>How do I pay?</h2><p>Payment is taken on the day of the tour.</p><h2>Can I cancel?</h2><p>Yes, free of charge up to 24 hours before departure from your dashboard.</p><h2>Are bikes and helmets included?</h2><p>Yes, on all cycling tours.</p></Prose>
    </>
  ),
});
