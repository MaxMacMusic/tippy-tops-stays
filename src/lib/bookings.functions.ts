import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getBookedRanges = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.rpc("get_booked_ranges");
  if (error) {
    console.error("get_booked_ranges error", error);
    return { ranges: [] as { check_in: string; check_out: string }[] };
  }
  return { ranges: data ?? [] };
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

    const total = nights * 260;

    // Check overlap
    const { data: existing, error: rpcErr } = await supabaseAdmin.rpc("get_booked_ranges");
    if (rpcErr) throw new Error("Could not check availability.");
    const overlap = (existing ?? []).some(
      (r: { check_in: string; check_out: string }) =>
        new Date(r.check_in) < co && new Date(r.check_out) > ci,
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
