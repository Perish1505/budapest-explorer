import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LayoutGrid, List, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TourCard } from "./TourCard";
import { toursQuery } from "@/lib/tours";

export type CatalogFilters = {
  type?: "walking" | "cycling" | undefined;
  date?: string | undefined;
  people?: number | undefined;
  q?: string | undefined;
};

const PAGE = 6;

export function TourCatalog({ initial, lockType }: { initial: CatalogFilters; lockType?: "walking" | "cycling" }) {
  const { data, isLoading, error, refetch } = useQuery(toursQuery());
  const [q, setQ] = useState(initial.q ?? "");
  const [type, setType] = useState<string>(lockType ?? initial.type ?? "all");
  const [date, setDate] = useState(initial.date ?? "");
  const [maxPrice, setMaxPrice] = useState(80);
  const [duration, setDuration] = useState("any");
  const [difficulty, setDifficulty] = useState("any");
  const [language, setLanguage] = useState("any");
  const [minRating, setMinRating] = useState("0");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [sort, setSort] = useState("popular");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [limit, setLimit] = useState(PAGE);
  const people = initial.people;

  const languages = useMemo(() => Array.from(new Set((data ?? []).flatMap((t) => t.languages))).sort(), [data]);
  const hasRatings = (data ?? []).some((t) => t.avgRating != null);

  const filtered = useMemo(() => {
    let list = (data ?? []).filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (q && !`${t.title} ${t.short_description} ${t.highlights.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (Number(t.price_adult) > maxPrice) return false;
      if (duration === "short" && t.duration_minutes > 150) return false;
      if (duration === "long" && t.duration_minutes <= 150) return false;
      if (difficulty !== "any" && !t.difficulty.toLowerCase().includes(difficulty)) return false;
      if (language !== "any" && !t.languages.includes(language)) return false;
      if (Number(minRating) > 0 && (t.avgRating ?? 0) < Number(minRating)) return false;
      if (onlyAvailable && !t.nextDeparture) return false;
      if (date && !t.availableDays.includes(date)) return false;
      if (people && people > t.max_group_size) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return Number(a.price_adult) - Number(b.price_adult);
      if (sort === "price-desc") return Number(b.price_adult) - Number(a.price_adult);
      if (sort === "duration") return a.duration_minutes - b.duration_minutes;
      if (sort === "rating") return (b.avgRating ?? 0) - (a.avgRating ?? 0);
      return Number(b.featured) - Number(a.featured) || b.reviewCount - a.reviewCount;
    });
    return list;
  }, [data, type, q, maxPrice, duration, difficulty, language, minRating, onlyAvailable, date, people, sort]);

  const reset = () => {
    setQ(""); if (!lockType) setType("all"); setDate(""); setMaxPrice(80); setDuration("any"); setDifficulty("any"); setLanguage("any"); setMinRating("0"); setOnlyAvailable(true);
  };

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit space-y-5 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
        <Input placeholder="Search tours…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tours" />
        {!lockType && (
          <Field label="Category">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="walking">Walking</SelectItem>
                <SelectItem value="cycling">Cycling</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field label="Date">
          <Input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={`Max price: €${maxPrice}`}>
          <Slider min={10} max={80} step={5} value={[maxPrice]} onValueChange={(v) => setMaxPrice(v[0] ?? 80)} />
        </Field>
        <Field label="Duration">
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="short">Up to 2.5 hours</SelectItem>
              <SelectItem value="long">Over 2.5 hours</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Difficulty">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="challenging">Challenging</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Language">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {hasRatings && (
          <Field label="Minimum rating">
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any</SelectItem>
                <SelectItem value="3">3+ stars</SelectItem>
                <SelectItem value="4">4+ stars</SelectItem>
                <SelectItem value="4.5">4.5+ stars</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
        <label className="flex items-center justify-between text-sm">
          Only available tours
          <Switch checked={onlyAvailable} onCheckedChange={setOnlyAvailable} />
        </label>
        <Button variant="ghost" size="sm" onClick={reset} className="w-full">Reset filters</Button>
      </aside>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading tours…" : `${filtered.length} tour${filtered.length === 1 ? "" : "s"} found`}
            {people ? ` · for ${people} people` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most popular</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="duration">Shortest first</SelectItem>
                <SelectItem value="rating">Top rated</SelectItem>
              </SelectContent>
            </Select>
            <Button variant={layout === "grid" ? "default" : "outline"} size="icon" onClick={() => setLayout("grid")} aria-label="Grid view"><LayoutGrid /></Button>
            <Button variant={layout === "list" ? "default" : "outline"} size="icon" onClick={() => setLayout("list")} aria-label="List view"><List /></Button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p>We couldn't load tours right now.</p>
            <Button className="mt-3" onClick={() => refetch()}>Try again</Button>
          </div>
        )}

        <div className={layout === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-5"}>
          {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[400px] rounded-2xl" />)}
          {filtered.slice(0, limit).map((t) => <TourCard key={t.id} tour={t} layout={layout} />)}
        </div>

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No tours match your filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try another date or loosen a filter.</p>
            <Button variant="outline" className="mt-4" onClick={reset}>Reset filters</Button>
          </div>
        )}

        {filtered.length > limit && (
          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" onClick={() => setLimit(limit + PAGE)}>Load more tours</Button>
          </div>
        )}
        {data?.some((t) => t.is_demo) && (
          <p className="mt-8 text-xs text-muted-foreground">Sample tours, prices and departure dates shown for demonstration.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
