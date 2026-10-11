import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { departuresQuery, type Tour } from "@/lib/tours";
import { budapestDay, calcTotal, formatDate, formatDateTime, formatPrice, formatTime, placesLeft } from "@/lib/booking-rules";

const PENDING_KEY = "be.pendingBooking";

function Counter({ label, sub, value, min, max, onChange }: { label: string; sub: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label}`}><Minus /></Button>
        <span className="w-5 text-center font-semibold">{value}</span>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label}`}><Plus /></Button>
      </div>
    </div>
  );
}

export function BookingWidget({ tour }: { tour: Tour }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: deps, isLoading } = useQuery(departuresQuery(tour.id));
  const [day, setDay] = useState("");
  const [depId, setDepId] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const available = useMemo(() => (deps ?? []).filter((d) => placesLeft(d.capacity, d.reserved) > 0), [deps]);
  const days = useMemo(() => Array.from(new Set(available.map((d) => budapestDay(d.starts_at)))), [available]);
  const times = available.filter((d) => budapestDay(d.starts_at) === day);
  const dep = available.find((d) => d.id === depId);
  const left = dep ? placesLeft(dep.capacity, dep.reserved) : tour.max_group_size;
  const maxPeople = Math.min(left, tour.max_group_size);
  const total = calcTotal(Number(tour.price_adult), tour.price_child != null ? Number(tour.price_child) : null, adults, children);

  // restore selection after sign-in
  useEffect(() => {
    if (!deps) return;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const p = JSON.parse(raw);
      if (p.tourId !== tour.id) return;
      const d = deps.find((x) => x.id === p.depId);
      if (d) {
        setDay(budapestDay(d.starts_at));
        setDepId(d.id);
      }
      setAdults(Math.max(1, Number(p.adults) || 1));
      setChildren(Math.max(0, Number(p.children) || 0));
      if (user && d) setConfirmOpen(true);
    } catch {
      /* ignore */
    }
    if (user) sessionStorage.removeItem(PENDING_KEY);
  }, [deps, tour.id, user]);

  useEffect(() => {
    if (times.length && !times.some((t) => t.id === depId)) setDepId(times[0].id);
  }, [day]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (adults + children > maxPeople) {
      setChildren(Math.max(0, maxPeople - adults));
      if (adults > maxPeople) setAdults(Math.max(1, maxPeople));
    }
  }, [maxPeople]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    if (!dep) return toast.error("Please choose a date and time");
    if (!user) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ tourId: tour.id, depId, adults, children }));
      toast.info("Please sign in to finish your booking. Your selection is saved.");
      navigate({ to: "/login", search: { redirect: `/tours/${tour.slug}` } });
      return;
    }
    setConfirmOpen(true);
  };

  const confirm = async () => {
    if (!dep) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("create_booking", {
      _departure_id: dep.id,
      _adults: adults,
      _children: children,
      _notes: notes.trim().slice(0, 500) || undefined,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["departures", tour.id] });
      return;
    }
    const ref = data?.[0]?.reference;
    qc.invalidateQueries();
    toast.success("Booking confirmed!");
    setConfirmOpen(false);
    navigate({ to: "/booking/confirmation/$reference", params: { reference: ref! } });
  };

  return (
    <div id="book" className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-lift)]">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-display text-3xl font-semibold text-primary">{formatPrice(tour.price_adult)}</span>
          <span className="text-sm text-muted-foreground"> / adult</span>
        </div>
        {tour.price_child != null && <span className="text-sm text-muted-foreground">Child {formatPrice(tour.price_child)}</span>}
      </div>

      {isLoading ? (
        <Skeleton className="mt-6 h-40" />
      ) : days.length === 0 ? (
        <p className="mt-6 rounded-xl bg-muted p-4 text-sm">No upcoming departures right now. Please check back soon or contact us.</p>
      ) : (
        <div className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</span>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger><SelectValue placeholder="Choose a date" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {days.map((d) => <SelectItem key={d} value={d}>{formatDate(`${d}T12:00:00Z`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departure time</span>
            <Select value={depId} onValueChange={setDepId} disabled={!day}>
              <SelectTrigger><SelectValue placeholder={day ? "Choose a time" : "Pick a date first"} /></SelectTrigger>
              <SelectContent>
                {times.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {formatTime(t.starts_at)} · {placesLeft(t.capacity, t.reserved)} places left
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="space-y-3 rounded-2xl bg-muted/50 p-4">
            <Counter label="Adults" sub={formatPrice(tour.price_adult)} value={adults} min={1} max={maxPeople - children} onChange={setAdults} />
            {tour.price_child != null && (
              <Counter label="Children" sub={`${formatPrice(tour.price_child)}${tour.min_age ? ` · age ${tour.min_age}+` : ""}`} value={children} min={0} max={maxPeople - adults} onChange={setChildren} />
            )}
          </div>
          {dep && (
            <div className={`flex items-center gap-2 text-sm ${left <= 3 ? "text-secondary" : "text-accent"}`}>
              <Users className="h-4 w-4" /> {left <= 3 ? `Only ${left} places left` : `${left} places available`}
              {dep.is_demo && <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Demo departure</span>}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-medium">Total</span>
            <span className="font-display text-2xl font-semibold">{formatPrice(total)}</span>
          </div>
          <Button size="lg" variant="secondary" className="w-full" onClick={start} disabled={!dep}>Book This Tour</Button>
          <p className="text-center text-xs text-muted-foreground">Free cancellation up to 24 hours before departure. Pay on the day.</p>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your booking</DialogTitle>
            <DialogDescription>Please check the details below.</DialogDescription>
          </DialogHeader>
          {dep && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Tour</dt><dd className="font-medium">{tour.title}</dd>
              <dt className="text-muted-foreground">When</dt><dd>{formatDateTime(dep.starts_at)}</dd>
              <dt className="text-muted-foreground">Meeting point</dt><dd>{tour.meeting_point}</dd>
              <dt className="text-muted-foreground">Guests</dt><dd>{adults} adult{adults > 1 ? "s" : ""}{children ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}</dd>
              <dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{formatPrice(total)}</dd>
            </dl>
          )}
          <Textarea placeholder="Notes for your guide (optional)" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Back</Button>
            <Button variant="secondary" onClick={confirm} disabled={busy}>{busy ? "Booking…" : "Confirm booking"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
