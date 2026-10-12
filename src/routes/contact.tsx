import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Budapest Explorer" },
      { name: "description", content: "Questions about a tour or a group booking? Send us a message." },
      { property: "og:title", content: "Contact Budapest Explorer" },
      { property: "og:description", content: "Get in touch with our team in Budapest." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(5, "Message is too short").max(2000),
});

function Contact() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "Invalid input"); return; }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(p.data);
    setBusy(false);
    if (error) { toast.error("Could not send your message. Please try again."); return; }
    toast.success("Message sent — we'll reply soon.");
    setF({ name: "", email: "", message: "" });
  };
  return (
    <>
      <PageHero eyebrow="Contact" title="Say hello" subtitle="Questions about a tour, private groups or accessibility? We usually reply within a day." />
      <form onSubmit={submit} className="container-page max-w-xl space-y-4 py-14">
        <Input placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={100} />
        <Input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={255} />
        <Textarea placeholder="Your message" rows={6} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={2000} />
        <Button type="submit" variant="secondary" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
      </form>
    </>
  );
}
