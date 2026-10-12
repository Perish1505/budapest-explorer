import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthCard, FieldError } from "@/components/site/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import { safeRedirect } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Create an account — Budapest Explorer" },
      { name: "description", content: "Register to book walking and cycling tours in Budapest." },
      { property: "og:title", content: "Register — Budapest Explorer" },
      { property: "og:description", content: "Create an account to book tours." },
    ],
  }),
  component: Register,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "At least 8 characters").max(72).regex(/[A-Za-z]/, "Include a letter").regex(/\d/, "Include a number"),
    confirm: z.string(),
    terms: z.literal(true, { message: "Please accept the terms" }),
    newsletter: z.boolean(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

function Register() {
  const { redirect } = Route.useSearch();
  const [f, setF] = useState({ fullName: "", email: "", password: "", confirm: "", terms: false, newsletter: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) {
      setErrors(Object.fromEntries(p.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: p.data.email,
      password: p.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}${safeRedirect(redirect)}`,
        data: { full_name: p.data.fullName, newsletter: p.data.newsletter },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.toLowerCase().includes("registered") ? "This email is already registered." : error.message);
      return;
    }
    if (data.user && data.user.identities?.length === 0) {
      toast.error("This email is already registered.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <MailCheck className="h-10 w-10 text-accent" />
        <p className="mt-4 text-sm">We sent a confirmation link to <strong>{f.email}</strong>. Click it to activate your account, then sign in.</p>
        <Button asChild className="mt-6 w-full"><Link to="/login" search={{ redirect }}>Go to sign in</Link></Button>
      </AuthCard>
    );
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <AuthCard title="Create your account" subtitle="Book tours and keep all your reservations in one place.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><Label htmlFor="n">Full name</Label><Input id="n" value={f.fullName} onChange={set("fullName")} /><FieldError msg={errors["fullName"]} /></div>
        <div><Label htmlFor="e">Email</Label><Input id="e" type="email" value={f.email} onChange={set("email")} /><FieldError msg={errors["email"]} /></div>
        <div><Label htmlFor="p">Password</Label><Input id="p" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} /><FieldError msg={errors["password"]} /></div>
        <div><Label htmlFor="c">Confirm password</Label><Input id="c" type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} /><FieldError msg={errors["confirm"]} /></div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={f.terms} onCheckedChange={(v) => setF({ ...f, terms: v === true })} className="mt-0.5" />
          <span>I accept the <Link to="/terms" className="text-primary underline">Terms & Conditions</Link></span>
        </label>
        <FieldError msg={errors["terms"]} />
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox checked={f.newsletter} onCheckedChange={(v) => setF({ ...f, newsletter: v === true })} className="mt-0.5" />
          Send me occasional news and offers (optional)
        </label>
        <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered? <Link to="/login" search={{ redirect }} className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </AuthCard>
  );
}
