import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatPrice } from "@/lib/booking-rules";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["booking_status"];

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Admin — Budapest Explorer" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, tours(title), tour_departures(starts_at)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
  const active = (data ?? []).filter((b) => b.status !== "cancelled" && b.status !== "rejected");
  const revenue = active.reduce((s, b) => s + Number(b.total), 0);

  const setStatus = async (id: string, s: Status) => {
    const { error } = s === "cancelled"
      ? await supabase.rpc("cancel_booking", { _booking_id: id })
      : await supabase.rpc("admin_set_booking_status", { _booking_id: id, _status: s });
    if (error) { toast.error(error.message); return; }
    toast.success("Booking updated");
    qc.invalidateQueries();
  };

  const exportCsv = () => {
    const rows = [["Reference", "Tour", "Date", "Customer", "Email", "Adults", "Children", "Total", "Status"],
      ...(data ?? []).map((b) => [b.reference, b.tours?.title ?? "", b.tour_departures?.starts_at ?? "", b.customer_name ?? "", b.customer_email ?? "", b.adults, b.children, b.total, b.status])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "bookings.csv";
    a.click();
  };

  return (
    <div className="container-page py-12">
      <div className="eyebrow">Admin</div>
      <h1 className="mt-2 text-4xl font-semibold text-primary">Bookings overview</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[["Bookings", String(data?.length ?? 0)], ["Active", String(active.length)], ["Booked revenue", formatPrice(revenue)]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">{l}</div><div className="mt-1 font-display text-3xl font-semibold">{v}</div></div>
        ))}
      </div>
      <div className="mt-8 flex justify-end"><Button variant="outline" onClick={exportCsv}><Download />Export CSV</Button></div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        {isLoading ? <Skeleton className="h-40" /> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left"><tr>{["Ref", "Tour", "Date", "Customer", "Guests", "Total", "Status"].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {(data ?? []).map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{b.reference}</td>
                  <td className="p-3">{b.tours?.title}</td>
                  <td className="p-3 whitespace-nowrap">{b.tour_departures && formatDateTime(b.tour_departures.starts_at)}</td>
                  <td className="p-3">{b.customer_name}<div className="text-xs text-muted-foreground">{b.customer_email}</div></td>
                  <td className="p-3">{b.adults + b.children}</td>
                  <td className="p-3">{formatPrice(b.total)}</td>
                  <td className="p-3">
                    <Select value={b.status} onValueChange={(v) => setStatus(b.id, v as Status)} disabled={b.status === "cancelled" || b.status === "rejected"}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{["pending", "confirmed", "completed", "cancelled", "rejected"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {data?.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No bookings yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
