import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose } from "@/components/site/PageHero";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Budapest Explorer" },
      { name: "description", content: "Privacy Policy for Budapest Explorer walking and cycling tours." },
      { property: "og:title", content: "Privacy Policy — Budapest Explorer" },
      { property: "og:description", content: "Privacy Policy for Budapest Explorer tours." },
    ],
  }),
  component: () => (
    <>
      <PageHero title="Privacy Policy" />
      <Prose><p>We store your name, email and booking details only to provide your tours. We never sell your data. You can ask us to delete your account at any time.</p></Prose>
    </>
  ),
});
