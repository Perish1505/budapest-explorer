import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/site/AuthCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Budapest Explorer" },
      { name: "description", content: "Request a password reset link." },
      { property: "og:title", content: "Reset password — Budapest Explorer" },
      { property: "og:description", content: "Request a password reset link." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = z.string().trim().email().safeParse(email);
    if (!p.success) { toast.error("Enter a valid email"); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(p.data, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) { toast.error("Could not send the link. Please try again."); return; }
    setSent(true);
  };
  return (
    <AuthCard title="Forgot your password?" subtitle="We'll email you a link to set a new one.">
      {sent ? (
        <p className="text-sm">If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
    </AuthCard>
  );
}
