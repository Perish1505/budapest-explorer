import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/PageHero";

export const Route = createFileRoute("/cancellation-policy")({
  head: () => ({
    meta: [
      { title: "Booking and Cancellation Policy — Budapest Explorer" },
      { name: "description", content: "Booking and Cancellation Policy for Budapest Explorer walking and cycling tours." },
      { property: "og:title", content: "Booking and Cancellation Policy — Budapest Explorer" },
      { property: "og:description", content: "Booking and Cancellation Policy for Budapest Explorer tours." },
    ],
  }),
  component: () => (
    <>
      <PageHero title="Booking and Cancellation Policy" />
      <Prose><ul><li>Free cancellation up to 24 hours before departure.</li><li>Cancellations within 24 hours are not possible online; contact us.</li><li>If we cancel due to weather, you can reschedule or get a full refund.</li></ul></Prose>
    </>
  ),
});
