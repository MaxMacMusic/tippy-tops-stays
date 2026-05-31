import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getUnavailableRanges = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.rpc("get_unavailable_ranges");
  if (error) {
    console.error("get_unavailable_ranges error", error);
    return { ranges: [] as { start_date: string; end_date: string }[] };
  }
  return { ranges: data ?? [] };
});

export const getNightlyRate = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("nightly_rate_aud")
    .eq("id", 1)
    .single();
  if (error || !data) return { rate: 260 };
  return { rate: data.nightly_rate_aud };
});

export const getContactEmail = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("contact_email")
    .eq("id", 1)
    .single();
  return { email: (data as { contact_email?: string } | null)?.contact_email ?? "tippytopsproperty@gmail.com" };
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

    const { data: settings } = await supabaseAdmin
      .from("settings")
      .select("nightly_rate_aud")
      .eq("id", 1)
      .single();
    const rate = settings?.nightly_rate_aud ?? 260;
    const subtotal = nights * rate;
    const discount = nights > 4 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount;

    // Check overlap against bookings + blocked dates
    const { data: existing, error: rpcErr } = await supabaseAdmin.rpc("get_unavailable_ranges");
    if (rpcErr) throw new Error("Could not check availability.");
    const overlap = (existing ?? []).some(
      (r: { start_date: string; end_date: string }) =>
        new Date(r.start_date) < co && new Date(r.end_date) > ci,
    );
    if (overlap) throw new Error("Those dates are no longer available.");

    const { data: inserted, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        guest_name: data.guest_name,
        email: data.email,
        phone: data.phone || null,
        check_in: data.check_in,
        check_out: data.check_out,
        guests: data.guests,
        nights,
        total_aud: total,
        message: data.message || null,
        status: data.kind === "enquiry" ? "enquiry" : "pending",
      })
      .select("id, nights, total_aud")
      .single();

    if (error) {
      console.error("insert booking error", error);
      throw new Error("Could not save booking. Please try again.");
    }

    return { id: inserted.id, nights: inserted.nights, total_aud: inserted.total_aud };
  });
