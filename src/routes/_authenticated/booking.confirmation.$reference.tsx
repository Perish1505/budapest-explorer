import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatPrice } from "@/lib/booking-rules";

export const Route = createFileRoute("/_authenticated/booking/confirmation/$reference")({
  head: () => ({ meta: [{ title: "Booking confirmed — Budapest Explorer" }, { name: "robots", content: "noindex" }] }),
  component: Confirmation,
});

function Confirmation() {
  const { reference } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["booking", reference],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, tours(title, meeting_point, meeting_address), tour_departures(starts_at)")
        .eq("reference", reference)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="container-page max-w-2xl py-16"><Skeleton className="h-80 rounded-3xl" /></div>;
  if (error || !data) return <div className="container-page py-24 text-center"><h1 className="text-2xl font-semibold">Booking not found</h1><Button asChild className="mt-6"><Link to="/dashboard">My bookings</Link></Button></div>;

  return (
    <div className="container-page max-w-2xl py-16">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-lift)]">
        <CircleCheck className="h-12 w-12 text-accent" />
        <h1 className="mt-4 text-3xl font-semibold text-primary">You're booked!</h1>
        <p className="mt-2 text-muted-foreground">Show this reference to your guide.</p>
        <div className="mt-6 rounded-2xl bg-sand/70 p-5 text-center font-display text-3xl font-semibold tracking-wider">{data.reference}</div>
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Tour</dt><dd className="font-medium">{data.tours?.title}</dd>
          <dt className="text-muted-foreground">When</dt><dd>{data.tour_departures && formatDateTime(data.tour_departures.starts_at)}</dd>
          <dt className="text-muted-foreground">Meeting point</dt><dd>{data.tours?.meeting_point}<br /><span className="text-muted-foreground">{data.tours?.meeting_address}</span></dd>
          <dt className="text-muted-foreground">Guests</dt><dd>{data.adults} adult(s){data.children ? `, ${data.children} child(ren)` : ""}</dd>
          <dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{formatPrice(data.total)} · pay on the day</dd>
          <dt className="text-muted-foreground">Status</dt><dd className="capitalize">{data.status}</dd>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild><Link to="/dashboard">Go to my bookings</Link></Button>
          <Button asChild variant="outline"><Link to="/tours">Browse more tours</Link></Button>
        </div>
      </div>
    </div>
  );
}
