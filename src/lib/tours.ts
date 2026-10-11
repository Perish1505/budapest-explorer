import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tour = Database["public"]["Tables"]["tours"]["Row"];
export type Departure = Database["public"]["Tables"]["tour_departures"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export type ItineraryStep = { title: string; description?: string };

export type TourWithMeta = Tour & {
  nextDeparture: string | null;
  avgRating: number | null;
  reviewCount: number;
  availableDays: string[];
};

export const toursQuery = () =>
  queryOptions({
    queryKey: ["tours", "published"],
    queryFn: async (): Promise<TourWithMeta[]> => {
      const nowIso = new Date().toISOString();
      const [toursRes, depRes, revRes] = await Promise.all([
        supabase.from("tours").select("*").eq("published", true).order("created_at"),
        supabase
          .from("tour_departures")
          .select("tour_id, starts_at, capacity, reserved, status")
          .eq("status", "open")
          .gt("starts_at", nowIso)
          .order("starts_at")
          .limit(2000),
        supabase.from("reviews").select("tour_id, rating").eq("approved", true),
      ]);
      if (toursRes.error) throw toursRes.error;
      const deps = (depRes.data ?? []).filter((d) => d.reserved < d.capacity);
      const revs = revRes.data ?? [];
      return (toursRes.data ?? []).map((t) => {
        const td = deps.filter((d) => d.tour_id === t.id);
        const tr = revs.filter((r) => r.tour_id === t.id);
        return {
          ...t,
          nextDeparture: td[0]?.starts_at ?? null,
          availableDays: td.map((d) =>
            new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Budapest" }).format(new Date(d.starts_at)),
          ),
          reviewCount: tr.length,
          avgRating: tr.length ? tr.reduce((s, r) => s + r.rating, 0) / tr.length : null,
        };
      });
    },
  });

export const tourBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["tour", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const departuresQuery = (tourId: string) =>
  queryOptions({
    queryKey: ["departures", tourId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_departures")
        .select("*")
        .eq("tour_id", tourId)
        .eq("status", "open")
        .gt("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

export const tourReviewsQuery = (tourId: string) =>
  queryOptions({
    queryKey: ["reviews", tourId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("tour_id", tourId)
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const typeLabel = (t: string) => (t === "cycling" ? "Cycling" : "Walking");
