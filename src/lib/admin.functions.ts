import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, isAdminUser } from "./admin-guard.server";

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({
    isAdmin: await isAdminUser(context.supabase, context.userId),
  }));

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const [{ data: settings }, { data: blocks }, { data: bookings }, { data: periods }] =
      await Promise.all([
        supabase
          .from("settings")
          .select("nightly_rate_aud, weekend_rate_aud, contact_email")
          .eq("id", 1)
          .single(),
        supabase.from("blocked_dates").select("id, start_date, end_date, reason").order("start_date"),
        supabase
          .from("bookings")
          .select(
            "id, guest_name, email, phone, check_in, check_out, nights, total_aud, status, guests, message, created_at",
          )
          .order("check_in", { ascending: true }),
        supabase
          .from("rate_periods")
          .select("id, name, start_date, end_date, nightly_rate_aud")
          .order("start_date"),
      ]);

    const s = settings as
      | { nightly_rate_aud?: number; weekend_rate_aud?: number; contact_email?: string }
      | null;
    return {
      rate: s?.nightly_rate_aud ?? 260,
      weekendRate: s?.weekend_rate_aud ?? s?.nightly_rate_aud ?? 260,
      contactEmail: s?.contact_email ?? "tippytopsproperty@gmail.com",
      blocks: blocks ?? [],
      bookings: bookings ?? [],
      periods: periods ?? [],
      isAdmin: true,
    };
  });

export const updateWeekendRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rate: number }) =>
    z.object({ rate: z.number().int().min(1).max(10000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("settings")
      .update({ weekend_rate_aud: data.rate, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addRatePeriod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; start_date: string; end_date: string; rate: number }) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        rate: z.number().int().min(1).max(10000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (new Date(data.end_date) < new Date(data.start_date)) {
      throw new Error("End date must be on or after start date.");
    }
    const { error } = await context.supabase.from("rate_periods").insert({
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      nightly_rate_aud: data.rate,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateRatePeriod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; rate: number }) =>
    z.object({ id: z.string().uuid(), rate: z.number().int().min(1).max(10000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("rate_periods")
      .update({ nightly_rate_aud: data.rate })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRatePeriod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("rate_periods").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const updateContactEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("settings")
      .update({ contact_email: data.email, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateNightlyRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rate: number }) =>
    z.object({ rate: z.number().int().min(1).max(10000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("settings")
      .update({ nightly_rate_aud: data.rate, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addBlockedRange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { start_date: string; end_date: string; reason?: string }) =>
    z
      .object({
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reason: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (new Date(data.end_date) < new Date(data.start_date)) {
      throw new Error("End date must be on or after start date.");
    }
    const { error } = await context.supabase.from("blocked_dates").insert({
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBlockedRange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("blocked_dates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["confirmed", "paid", "cancelled", "pending", "enquiry"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("bookings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
