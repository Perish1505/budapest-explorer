import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/site/AuthCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Budapest Explorer" },
      { name: "description", content: "Choose a new password for your account." },
      { property: "og:title", content: "New password — Budapest Explorer" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8 || !/\d/.test(pw) || !/[A-Za-z]/.test(pw)) { toast.error("Use at least 8 characters with a letter and a number"); return; }
    if (pw !== pw2) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error("The reset link is invalid or expired. Request a new one."); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };
  return (
    <AuthCard title="Set a new password">
      <form onSubmit={submit} className="space-y-4">
        <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        <Input type="password" placeholder="Repeat password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        <Button type="submit" className="w-full" disabled={busy}>Save password</Button>
      </form>
    </AuthCard>
  );
}
