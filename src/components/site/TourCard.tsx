import { Link } from "@tanstack/react-router";
import { Bike, CalendarDays, Clock, Footprints, Gauge, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDuration, formatPrice } from "@/lib/booking-rules";
import type { TourWithMeta } from "@/lib/tours";

export function TypeBadge({ type }: { type: string }) {
  const cycling = type === "cycling";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cycling ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
      {cycling ? <Bike className="h-3.5 w-3.5" /> : <Footprints className="h-3.5 w-3.5" />}
      {cycling ? "Cycling" : "Walking"}
    </span>
  );
}

export function TourCard({ tour, layout = "grid" }: { tour: TourWithMeta; layout?: "grid" | "list" }) {
  const list = layout === "list";
  return (
    <article className={`group card-lift flex overflow-hidden rounded-2xl bg-card ${list ? "flex-col sm:flex-row" : "flex-col"}`}>
      <Link to="/tours/$slug" params={{ slug: tour.slug }} className={`relative block overflow-hidden ${list ? "aspect-[4/3] sm:aspect-auto sm:w-72 sm:shrink-0" : "aspect-[4/3]"}`}>
        <img src={tour.image_url ?? "/images/hero.jpg"} alt={tour.title} loading="lazy" width={1200} height={800} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute left-3 top-3"><TypeBadge type={tour.type} /></div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug">
            <Link to="/tours/$slug" params={{ slug: tour.slug }} className="hover:text-primary">{tour.title}</Link>
          </h3>
          {tour.avgRating != null && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-secondary text-secondary" />
              {tour.avgRating.toFixed(1)} <span className="text-muted-foreground">({tour.reviewCount})</span>
            </span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{tour.short_description}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDuration(tour.duration_minutes)}</span>
          <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{tour.difficulty}</span>
          {tour.nextDeparture && (
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Next: {formatDate(tour.nextDeparture)}</span>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <div className="text-xs text-muted-foreground">from</div>
            <div className="font-display text-2xl font-semibold text-primary">{formatPrice(tour.price_adult)}</div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/tours/$slug" params={{ slug: tour.slug }}>Details</Link></Button>
            <Button asChild variant="secondary" size="sm"><Link to="/tours/$slug" params={{ slug: tour.slug }} hash="book">Book now</Link></Button>
          </div>
        </div>
      </div>
    </article>
  );
}
