import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { canUserCancel, formatDateTime, formatPrice } from "@/lib/booking-rules";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "My bookings — Budapest Explorer" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

const statusTone: Record<string, string> = {
  confirmed: "bg-accent text-accent-foreground",
  pending: "bg-muted text-foreground",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  rejected: "bg-destructive/10 text-destructive",
};

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("upcoming");
  const [reviewFor, setReviewFor] = useState<{ id: string; tourId: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, tours(title, slug, image_url, type), tour_departures(starts_at), reviews(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const now = Date.now();
  const list = (data ?? []).filter((b) => {
    const t = new Date(b.tour_departures?.starts_at ?? 0).getTime();
    if (tab === "upcoming") return t > now && (b.status === "confirmed" || b.status === "pending");
    if (tab === "past") return t <= now && b.status !== "cancelled" && b.status !== "rejected";
    if (tab === "cancelled") return b.status === "cancelled" || b.status === "rejected";
    return true;
  });

  const cancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    const { error } = await supabase.rpc("cancel_booking", { _booking_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Booking cancelled");
    qc.invalidateQueries();
  };

  const submitReview = async () => {
    if (!reviewFor || !user) return;
    if (comment.trim().length > 2000) { toast.error("Review is too long"); return; }
    const { error } = await supabase.from("reviews").insert({
      booking_id: reviewFor.id, tour_id: reviewFor.tourId, user_id: user.id, rating, comment: comment.trim(),
      author_name: (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? null,
    });
    if (error) { toast.error("Could not save your review"); return; }
    toast.success("Thanks for your review!");
    setReviewFor(null); setComment(""); setRating(5);
    qc.invalidateQueries();
  };

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">My dashboard</div>
          <h1 className="mt-2 text-4xl font-semibold text-primary">Hello{user?.user_metadata?.full_name ? `, ${String(user.user_metadata.full_name).split(" ")[0]}` : ""}!</h1>
        </div>
        <Button asChild variant="outline"><Link to="/dashboard/profile">Profile settings</Link></Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6 space-y-4">
        {isLoading && <Skeleton className="h-32 rounded-2xl" />}
        {error && <p className="text-destructive">Could not load bookings. Please refresh.</p>}
        {!isLoading && list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No bookings here yet.</p>
            <Button asChild className="mt-4" variant="secondary"><Link to="/tours">Find a tour</Link></Button>
          </div>
        )}
        {list.map((b) => {
          const starts = b.tour_departures?.starts_at ?? "";
          const past = new Date(starts).getTime() <= now;
          const canReview = past && (b.status === "confirmed" || b.status === "completed") && !(b.reviews as { id: string }[] | null)?.length;
          return (
            <div key={b.id} className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card sm:flex-row">
              <img src={b.tours?.image_url ?? "/images/hero.jpg"} alt="" className="h-40 w-full object-cover sm:h-auto sm:w-48" loading="lazy" />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusTone[b.status]}`}>{b.status}</span>
                  <span className="text-xs text-muted-foreground">Ref {b.reference}</span>
                </div>
                <Link to="/tours/$slug" params={{ slug: b.tours?.slug ?? "" }} className="text-lg font-semibold hover:text-primary">{b.tours?.title}</Link>
                <div className="text-sm text-muted-foreground">{starts && formatDateTime(starts)} · {b.adults + b.children} guest(s) · {formatPrice(b.total)}</div>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Button asChild size="sm" variant="outline"><Link to="/booking/confirmation/$reference" params={{ reference: b.reference }}>Details</Link></Button>
                  {canUserCancel(b.status, starts) && <Button size="sm" variant="destructive" onClick={() => cancel(b.id)}>Cancel booking</Button>}
                  {canReview && <Button size="sm" variant="secondary" onClick={() => setReviewFor({ id: b.id, tourId: b.tour_id })}>Leave a review</Button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!reviewFor} onOpenChange={(o) => !o && setReviewFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>How was your tour?</DialogTitle></DialogHeader>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-7 w-7 ${n <= rating ? "fill-secondary text-secondary" : "text-border"}`} />
              </button>
            ))}
          </div>
          <Textarea placeholder="Tell other travellers about it" maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter><Button variant="secondary" onClick={submitReview}>Submit review</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
