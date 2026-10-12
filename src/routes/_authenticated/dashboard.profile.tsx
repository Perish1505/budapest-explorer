import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile — Budapest Explorer" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, "Invalid phone number"),
  preferred_language: z.string().trim().max(40),
  newsletter: z.boolean(),
});

function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });
  const [f, setF] = useState({ full_name: "", phone: "", preferred_language: "English", newsletter: false });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) setF({ full_name: data.full_name ?? "", phone: data.phone ?? "", preferred_language: data.preferred_language ?? "English", newsletter: data.newsletter });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "Invalid input"); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ ...p.data, phone: p.data.phone || null }).eq("id", user!.id);
    setBusy(false);
    if (error) { toast.error("Could not save profile"); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <div className="container-page max-w-xl py-12">
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary">← My bookings</Link>
      <h1 className="mt-3 text-4xl font-semibold text-primary">Profile settings</h1>
      {isLoading ? <Skeleton className="mt-8 h-72 rounded-2xl" /> : (
        <form onSubmit={save} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div><Label htmlFor="fn">Full name</Label><Input id="fn" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><Label htmlFor="ph">Phone (optional)</Label><Input id="ph" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label htmlFor="lg">Preferred language</Label><Input id="lg" value={f.preferred_language} onChange={(e) => setF({ ...f, preferred_language: e.target.value })} /></div>
          <label className="flex items-center justify-between text-sm">Newsletter<Switch checked={f.newsletter} onCheckedChange={(v) => setF({ ...f, newsletter: v })} /></label>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </form>
      )}
    </div>
  );
}
