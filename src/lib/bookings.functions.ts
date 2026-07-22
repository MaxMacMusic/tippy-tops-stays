import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getUnavailableRanges = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().rpc("get_unavailable_ranges");
  if (error) {
    console.error("get_unavailable_ranges error", error);
    return { ranges: [] as { start_date: string; end_date: string }[] };
  }
  return { ranges: data ?? [] };
});

export const getNightlyRate = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("settings")
    .select("nightly_rate_aud")
    .eq("id", 1)
    .single();
  if (error || !data) return { rate: 260 };
  return { rate: data.nightly_rate_aud };
});

export const getContactEmail = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("settings")
    .select("contact_email")
    .eq("id", 1)
    .single();
  return {
    email:
      (data as { contact_email?: string } | null)?.contact_email ?? "tippytopsproperty@gmail.com",
  };
});

const bookingSchema = z.object({
  guest_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(6),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  kind: z.enum(["enquiry", "booking"]),
});

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof bookingSchema>) => bookingSchema.parse(d))
  .handler(async ({ data }) => {
    const ci = new Date(data.check_in);
    const co = new Date(data.check_out);
    const nights = Math.round((co.getTime() - ci.getTime()) / 86400000);
    if (nights < 2) throw new Error("Minimum 2 nights stay required.");

    const supabase = publicClient();

    const { data: settings } = await supabase
      .from("settings")
      .select("nightly_rate_aud")
      .eq("id", 1)
      .single();
    const rate = settings?.nightly_rate_aud ?? 260;
    const subtotal = nights * rate;
    const discount = nights > 4 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount;

    // Check overlap against bookings + blocked dates
    const { data: existing, error: rpcErr } = await supabase.rpc("get_unavailable_ranges");
    if (rpcErr) throw new Error("Could not check availability.");
    const overlap = (existing ?? []).some(
      (r: { start_date: string; end_date: string }) =>
        new Date(r.start_date) < co && new Date(r.end_date) > ci,
    );
    if (overlap) throw new Error("Those dates are no longer available.");

    const { data: rows, error } = await supabase.rpc("create_booking", {
      p_guest_name: data.guest_name,
      p_email: data.email,
      p_phone: data.phone || null,
      p_check_in: data.check_in,
      p_check_out: data.check_out,
      p_guests: data.guests,
      p_nights: nights,
      p_total_aud: total,
      p_message: data.message || null,
      p_status: data.kind === "enquiry" ? "enquiry" : "pending",
    });

    if (error) {
      console.error("create_booking error", error);
      if (error.message?.includes("UNAVAILABLE")) {
        throw new Error("Those dates are no longer available.");
      }
      if (error.message?.includes("MIN_NIGHTS")) {
        throw new Error("Minimum 2 nights stay required.");
      }
      throw new Error("Could not save booking. Please try again.");
    }

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error("Could not save booking. Please try again.");
    return { id: row.id, nights: row.nights, total_aud: row.total_aud };
  });

