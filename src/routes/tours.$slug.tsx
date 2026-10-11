import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bike, Check, CircleAlert, Clock, CloudRain, Gauge, Heart, Languages, MapPin, Ruler, ShieldCheck, Star, Users, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookingWidget } from "@/components/site/BookingWidget";
import { TourCard, TypeBadge } from "@/components/site/TourCard";
import { tourBySlugQuery, tourReviewsQuery, toursQuery, type ItineraryStep } from "@/lib/tours";
import { formatDate, formatDuration, CANCELLATION_HOURS } from "@/lib/booking-rules";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tours/$slug")({
  loader: async ({ context, params }) => {
    const tour = await context.queryClient.ensureQueryData(tourBySlugQuery(params.slug));
    if (!tour) throw notFound();
    return { title: tour.title, description: tour.short_description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Tour unavailable — Budapest Explorer" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.title} — Budapest Explorer` },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.description },
      ],
    };
  },
  notFoundComponent: TourNotFound,
  component: TourPage,
});

function TourNotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-semibold text-primary">Tour not found</h1>
      <p className="mt-2 text-muted-foreground">This tour may have been retired or is not published yet.</p>
      <Button asChild className="mt-6"><Link to="/tours">Browse tours</Link></Button>
    </div>
  );
}

function FavoriteButton({ tourId }: { tourId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: fav } = useQuery({
    queryKey: ["favorite", tourId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("tour_id").eq("tour_id", tourId).maybeSingle();
      return !!data;
    },
  });
  const toggle = async () => {
    if (!user) { toast.info("Sign in to save favourites"); return; }
    const { error } = fav
      ? await supabase.from("favorites").delete().eq("tour_id", tourId).eq("user_id", user.id)
      : await supabase.from("favorites").insert({ tour_id: tourId, user_id: user.id });
    if (error) { toast.error("Could not update favourites"); return; }
    toast.success(fav ? "Removed from favourites" : "Saved to favourites");
    qc.invalidateQueries({ queryKey: ["favorite"] });
    qc.invalidateQueries({ queryKey: ["favorites"] });
  };
  return (
    <Button variant="outline" size="sm" onClick={toggle}>
      <Heart className={fav ? "fill-secondary text-secondary" : ""} /> {fav ? "Saved" : "Save"}
    </Button>
  );
}

function List({ items, icon: Icon, tone }: { items: string[]; icon: typeof Check; tone: string }) {
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i} className="flex gap-2 text-sm"><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />{i}</li>
      ))}
    </ul>
  );
}

function TourPage() {
  const { slug } = Route.useParams();
  const { data: tour } = useSuspenseQuery(tourBySlugQuery(slug));
  const { data: reviews } = useQuery({ ...tourReviewsQuery(tour!.id) });
  const { data: all } = useQuery(toursQuery());
  if (!tour) return <TourNotFound />;
  const t = tour;
  const itinerary = (t.itinerary as ItineraryStep[]) ?? [];
  const related = (all ?? []).filter((x) => x.id !== t.id && x.type === t.type).slice(0, 3);
  const avg = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const d = 0.008;
  const mapSrc = t.lat && t.lng ? `https://www.openstreetmap.org/export/embed.html?bbox=${t.lng - d},${t.lat - d},${t.lng + d},${t.lat + d}&layer=mapnik&marker=${t.lat},${t.lng}` : null;

  const facts = [
    { i: Clock, l: "Duration", v: formatDuration(t.duration_minutes) },
    { i: Gauge, l: "Difficulty", v: t.difficulty },
    { i: Users, l: "Group size", v: `Max ${t.max_group_size}` },
    { i: Languages, l: "Languages", v: t.languages.join(", ") },
    ...(t.distance_km ? [{ i: Ruler, l: "Distance", v: `${t.distance_km} km` }] : []),
    ...(t.min_age ? [{ i: CircleAlert, l: "Minimum age", v: `${t.min_age}+` }] : []),
  ];

  return (
    <>
      <section className="relative isolate h-[56vh] min-h-[380px] overflow-hidden">
        <img src={t.image_url ?? "/images/hero.jpg"} alt={t.title} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="container-page flex h-full flex-col justify-end pb-10 text-primary-foreground">
          <div className="flex items-center gap-3"><TypeBadge type={t.type} />{avg != null && <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-secondary text-secondary" />{avg.toFixed(1)} ({reviews!.length} reviews)</span>}</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold md:text-6xl">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-primary-foreground/85">{t.short_description}</p>
        </div>
      </section>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground"><Link to="/tours" className="hover:text-primary">Tours</Link> / {t.title}</div>
            <FavoriteButton tourId={t.id} />
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
            {facts.map(({ i: Icon, l, v }) => (
              <div key={l} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 text-secondary" />
                <div><div className="text-xs text-muted-foreground">{l}</div><div className="text-sm font-medium">{v}</div></div>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-primary">About this tour</h2>
            <p className="mt-4 leading-relaxed text-foreground/85">{t.description}</p>
            {t.highlights.length > 0 && (
              <div className="mt-6"><h3 className="mb-3 font-semibold">Highlights</h3><List items={t.highlights} icon={Star} tone="text-secondary" /></div>
            )}
          </section>

          {itinerary.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-primary">Itinerary</h2>
              <ol className="mt-6 space-y-0">
                {itinerary.map((s, i) => (
                  <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
                      {i < itinerary.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="pt-1"><div className="font-semibold">{s.title}</div>{s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}</div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-semibold text-primary">Meeting point</h2>
            <p className="mt-3 flex gap-2"><MapPin className="h-5 w-5 shrink-0 text-secondary" /><span><strong>{t.meeting_point}</strong><br /><span className="text-muted-foreground">{t.meeting_address}</span></span></p>
            {mapSrc && <iframe title="Meeting point map" src={mapSrc} className="mt-4 h-72 w-full rounded-2xl border border-border" loading="lazy" />}
          </section>

          <section className="grid gap-8 sm:grid-cols-2">
            <div><h3 className="mb-3 font-semibold">Included</h3><List items={t.included} icon={Check} tone="text-accent" /></div>
            <div><h3 className="mb-3 font-semibold">Not included</h3><List items={t.excluded} icon={X} tone="text-destructive" /></div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary">Good to know</h2>
            <Accordion type="multiple" className="mt-4">
              {t.equipment && (
                <AccordionItem value="eq"><AccordionTrigger><span className="flex items-center gap-2">{t.type === "cycling" ? <Bike className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}Equipment</span></AccordionTrigger><AccordionContent>{t.equipment}</AccordionContent></AccordionItem>
              )}
              {t.safety_info && (
                <AccordionItem value="safety"><AccordionTrigger><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Safety</span></AccordionTrigger><AccordionContent>{t.safety_info}</AccordionContent></AccordionItem>
              )}
              <AccordionItem value="weather"><AccordionTrigger><span className="flex items-center gap-2"><CloudRain className="h-4 w-4" />Weather & rescheduling</span></AccordionTrigger><AccordionContent>Tours run in light rain — bring a jacket. In severe weather we will contact you to reschedule or cancel with a full refund.</AccordionContent></AccordionItem>
              <AccordionItem value="cancel"><AccordionTrigger>Cancellation policy</AccordionTrigger><AccordionContent>Cancel free of charge from your dashboard up to {CANCELLATION_HOURS} hours before departure. <Link to="/cancellation-policy" className="text-primary underline">Full policy</Link>.</AccordionContent></AccordionItem>
              <AccordionItem value="faq1"><AccordionTrigger>Do I need to print my ticket?</AccordionTrigger><AccordionContent>No — just show your booking reference on your phone.</AccordionContent></AccordionItem>
              <AccordionItem value="faq2"><AccordionTrigger>What if I'm running late?</AccordionTrigger><AccordionContent>Guides wait up to 10 minutes. Call us and we'll try to help you catch up.</AccordionContent></AccordionItem>
            </Accordion>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary">Reviews</h2>
            {reviews && reviews.length > 0 ? (
              <div className="mt-6 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-secondary text-secondary" : "text-border"}`} />)}</div>
                      <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="mt-3 text-sm">{r.comment}</p>}
                    <div className="mt-2 text-xs text-muted-foreground">{r.author_name || "Verified guest"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No reviews yet. Guests can review this tour after completing it.</p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit"><BookingWidget tour={t} /></aside>
      </div>

      {related.length > 0 && (
        <section className="container-page pb-8">
          <h2 className="text-2xl font-semibold text-primary">You might also like</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <TourCard key={r.id} tour={r} />)}</div>
        </section>
      )}
    </>
  );
}
