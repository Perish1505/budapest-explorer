import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, CalendarCheck, Compass, HandCoins, Heart, MapPinned, Route as RouteIcon, Search, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TourCard } from "@/components/site/TourCard";
import { toursQuery } from "@/lib/tours";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/booking-rules";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Budapest Explorer — Guided Walking & Cycling Tours in Budapest" },
      { name: "description", content: "Discover Budapest on foot or by bike with small-group tours led by local guides. Check dates, prices and book online." },
      { property: "og:title", content: "Budapest Explorer — Walking & Cycling Tours" },
      { property: "og:description", content: "Small-group walking and cycling tours of Budapest with local guides. Book online." },
    ],
  }),
  component: Home,
});

const highlights = [
  { name: "Hungarian Parliament Building", area: "Pest, District V", text: "Neo-Gothic landmark on the Danube, completed in 1904 and home to the Holy Crown." },
  { name: "Buda Castle", area: "Castle Hill, District I", text: "Former royal palace complex, now housing the National Gallery and Budapest History Museum." },
  { name: "Fisherman's Bastion", area: "Castle Hill, District I", text: "Neo-Romanesque terrace with seven towers and sweeping views over Pest." },
  { name: "Chain Bridge", area: "Linking Buda & Pest", text: "Széchenyi Chain Bridge, opened in 1849, the first permanent bridge across the Danube in the city." },
  { name: "St. Stephen's Basilica", area: "Pest, District V", text: "Budapest's largest church, with a dome rising 96 metres and a panoramic gallery." },
  { name: "Heroes' Square", area: "District XIV", text: "Millennium Monument with statues of Hungary's founding chieftains, at the gate of City Park." },
  { name: "Margaret Island", area: "On the Danube", text: "2.5 km car-free park island with gardens, a musical fountain and a running track." },
  { name: "The Danube Riverfront", area: "Both banks", text: "UNESCO World Heritage panorama of embankments, bridges and promenades." },
  { name: "The Jewish Quarter", area: "District VII", text: "Historic Erzsébetváros, home to the Dohány Street Synagogue and ruin bars." },
  { name: "Gellért Hill", area: "Buda, District XI", text: "235 m hill topped by the Citadel and Liberty Statue, with views over the city." },
];

function SearchWidget() {
  const navigate = useNavigate();
  const [type, setType] = useState("all");
  const [date, setDate] = useState("");
  const [people, setPeople] = useState("2");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({
          to: "/tours",
          search: {
            type: type === "all" ? undefined : (type as "walking" | "cycling"),
            date: date || undefined,
            people: Number(people) || undefined,
          },
        });
      }}
      className="grid gap-3 rounded-2xl bg-card p-3 text-foreground shadow-2xl sm:grid-cols-[1fr_1fr_0.7fr_auto] sm:items-end"
    >
      <label className="space-y-1 px-2">
        <span className="text-xs font-medium text-muted-foreground">Tour type</span>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="border-0 bg-muted/60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tours</SelectItem>
            <SelectItem value="walking">Walking</SelectItem>
            <SelectItem value="cycling">Cycling</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="space-y-1 px-2">
        <span className="text-xs font-medium text-muted-foreground">Preferred date</span>
        <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="border-0 bg-muted/60" />
      </label>
      <label className="space-y-1 px-2">
        <span className="text-xs font-medium text-muted-foreground">Participants</span>
        <Input type="number" min={1} max={14} value={people} onChange={(e) => setPeople(e.target.value)} className="border-0 bg-muted/60" />
      </label>
      <Button type="submit" variant="secondary" size="lg" className="rounded-xl"><Search />Search</Button>
    </form>
  );
}

function Reviews() {
  const { data } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("id, rating, comment, author_name, created_at, tours(title)").eq("approved", true).order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });
  return (
    <section className="container-page py-20">
      <div className="eyebrow">Guest reviews</div>
      <h2 className="mt-2 text-3xl font-semibold text-primary md:text-4xl">From travellers who joined us</h2>
      {data && data.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {data.map((r) => (
            <figure key={r.id} className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-secondary text-secondary" : "text-border"}`} />)}</div>
              <blockquote className="mt-4 text-foreground/85">"{r.comment}"</blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">
                {r.author_name || "Verified guest"} · {(r.tours as { title: string } | null)?.title} · {formatDate(r.created_at)}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-6 max-w-xl text-muted-foreground">Reviews appear here once guests complete a tour and share their experience. Only verified bookings can leave a review.</p>
      )}
    </section>
  );
}

function Home() {
  const { data: tours, isLoading } = useQuery(toursQuery());
  const featured = (tours ?? []).filter((t) => t.featured && t.nextDeparture).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-16 overflow-hidden pt-16">
        <img src="/images/hero.jpg" alt="Hungarian Parliament on the Danube at sunset" width={1920} height={1088} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="container-page flex min-h-[88vh] flex-col justify-end pb-14 pt-32 text-primary-foreground">
          <div className="eyebrow">Walking & cycling tours · Budapest</div>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.05] md:text-7xl">
            Discover Budapest, One Step or One Ride at a Time.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85 md:text-xl">
            Explore hidden streets, iconic landmarks, local stories, and unforgettable views with our guided walking and cycling tours.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg"><Link to="/tours">Explore Tours <ArrowRight /></Link></Button>
            <Button asChild variant="glass" size="lg"><a href="#adventure">Find Your Adventure</a></Button>
          </div>
          <div className="mt-12 max-w-4xl"><SearchWidget /></div>
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Featured tours</div>
            <h2 className="mt-2 text-3xl font-semibold text-primary md:text-4xl">Our most-loved routes</h2>
          </div>
          <Button asChild variant="outline"><Link to="/tours">See all tours <ArrowRight /></Link></Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[420px] rounded-2xl" />)}
          {featured.map((t) => <TourCard key={t.id} tour={t} />)}
        </div>
        {tours?.some((t) => t.is_demo) && (
          <p className="mt-6 text-xs text-muted-foreground">Sample tours, prices and departure dates shown for demonstration.</p>
        )}
      </section>

      {/* Choose adventure */}
      <section id="adventure" className="container-page scroll-mt-20 py-10">
        <div className="eyebrow">Choose your adventure</div>
        <h2 className="mt-2 text-3xl font-semibold text-primary md:text-4xl">On foot or on two wheels?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[
            { to: "/walking-tours" as const, img: "/images/tour-castle.jpg", title: "Walking Tours", text: "Explore Budapest on foot — historic neighbourhoods, grand architecture and hidden gems." },
            { to: "/cycling-tours" as const, img: "/images/tour-danube.jpg", title: "Cycling Tours", text: "Discover Budapest by bicycle — ride along the Danube, through parks and scenic routes." },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="group relative isolate flex min-h-[380px] items-end overflow-hidden rounded-3xl p-8 text-primary-foreground">
              <img src={c.img} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="hero-overlay absolute inset-0 -z-10" />
              <div>
                <h3 className="text-3xl font-semibold">{c.title}</h3>
                <p className="mt-2 max-w-md text-primary-foreground/85">{c.text}</p>
                <span className="mt-4 inline-flex items-center gap-2 font-medium text-secondary">Browse tours <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="mt-20 bg-sand/60 py-20">
        <div className="container-page">
          <div className="eyebrow">Why choose us</div>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold text-primary md:text-4xl">A local way to see the city</h2>
          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: Compass, t: "Local guides", d: "Born-and-raised Budapesters who know the stories behind every façade." },
              { i: Users, t: "Small groups", d: "Never more than 14 people, so everyone can hear, ask and keep up." },
              { i: RouteIcon, t: "Carefully designed routes", d: "Paced for comfort, with safe bike paths and the best viewpoints." },
              { i: CalendarCheck, t: "Easy online booking", d: "Real-time availability and instant confirmation." },
              { i: HandCoins, t: "Transparent pricing", d: "One clear price in EUR. No hidden fees." },
              { i: Heart, t: "Authentic experiences", d: "Cafés, courtyards and corners most visitors walk right past." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card text-secondary shadow-[var(--shadow-card)]"><Icon className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container-page py-20">
        <div className="eyebrow">Budapest highlights</div>
        <h2 className="mt-2 text-3xl font-semibold text-primary md:text-4xl">Places worth knowing</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Some of the city's best-known landmarks. Each tour page lists exactly which places that route visits.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {highlights.map((h) => (
            <div key={h.name} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-secondary">
              <MapPinned className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-semibold leading-snug">{h.name}</h3>
              <div className="mt-1 text-xs text-secondary">{h.area}</div>
              <p className="mt-2 text-sm text-muted-foreground">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container-page">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Three steps to the city</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {["Choose your walking or cycling adventure.", "Select a date and reserve your place.", "Meet your guide and explore Budapest."].map((s, i) => (
              <div key={s} className="border-t border-primary-foreground/20 pt-6">
                <div className="font-display text-5xl text-secondary">0{i + 1}</div>
                <p className="mt-3 text-lg">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Reviews />
    </>
  );
}
