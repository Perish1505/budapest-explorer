import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({ email: z.string().trim().email("Enter a valid email").max(255), consent: z.literal(true, { message: "Please give consent" }) });

function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, consent });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: parsed.data.email, consent: true });
    setBusy(false);
    if (error && error.code !== "23505") { toast.error("Could not subscribe, please try again."); return; }
    toast.success("Thanks! You're on the list.");
    setEmail("");
    setConsent(false);
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-ink-foreground/10 border-ink-foreground/20 text-ink-foreground placeholder:text-ink-foreground/50" aria-label="Email" />
        <Button type="submit" variant="secondary" disabled={busy}>Subscribe</Button>
      </div>
      <label className="flex items-start gap-2 text-xs text-ink-foreground/70">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5 border-ink-foreground/40" />
        I agree to receive occasional emails about tours and offers. Unsubscribe anytime.
      </label>
    </form>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="container-page grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-xl font-semibold">Budapest Explorer</h3>
          <p className="mt-3 text-sm text-ink-foreground/70">
            Small-group walking and cycling tours led by local guides who love their city.
          </p>
          <div className="mt-5 flex gap-3">
            {[Facebook, Instagram, Youtube].map((I, i) => (
              <a key={i} href="#" aria-label="Social media" className="grid h-9 w-9 place-items-center rounded-full bg-ink-foreground/10 transition hover:bg-secondary">
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="eyebrow">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink-foreground/80">
            <li><Link to="/walking-tours" className="hover:text-secondary">Walking tours</Link></li>
            <li><Link to="/cycling-tours" className="hover:text-secondary">Cycling tours</Link></li>
            <li><Link to="/tours" className="hover:text-secondary">All tours</Link></li>
            <li><Link to="/about" className="hover:text-secondary">About us</Link></li>
            <li><Link to="/faq" className="hover:text-secondary">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow">Info</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink-foreground/80">
            <li><Link to="/cancellation-policy" className="hover:text-secondary">Booking & cancellation</Link></li>
            <li><Link to="/privacy" className="hover:text-secondary">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:text-secondary">Terms & conditions</Link></li>
            <li><Link to="/contact" className="hover:text-secondary">Contact</Link></li>
          </ul>
          <ul className="mt-6 space-y-2 text-sm text-ink-foreground/80">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0" />Deák Ferenc tér, 1052 Budapest</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0" />+36 1 000 0000</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0" />hello@budapestexplorer.example</li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow">Newsletter</h4>
          <p className="mb-4 mt-4 text-sm text-ink-foreground/70">New routes, seasonal tours and local tips.</p>
          <Newsletter />
        </div>
      </div>
      <div className="border-t border-ink-foreground/10 py-6 text-center text-xs text-ink-foreground/50">
        © {new Date().getFullYear()} Budapest Explorer. All prices in EUR.
      </div>
    </footer>
  );
}
