import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Not authorised.");
}

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [{ data: settings }, { data: blocks }, { data: bookings }] = await Promise.all([
      supabaseAdmin.from("settings").select("nightly_rate_aud, contact_email").eq("id", 1).single(),
      supabaseAdmin.from("blocked_dates").select("id, start_date, end_date, reason").order("start_date"),
      supabaseAdmin
        .from("bookings")
        .select("id, guest_name, email, phone, check_in, check_out, nights, total_aud, status, guests, message, created_at")
        .order("check_in", { ascending: true }),
    ]);
    const s = settings as { nightly_rate_aud?: number; contact_email?: string } | null;
    return {
      rate: s?.nightly_rate_aud ?? 260,
      contactEmail: s?.contact_email ?? "tippytopsproperty@gmail.com",
      blocks: blocks ?? [],
      bookings: bookings ?? [],
      isAdmin: true,
    };
  });

export const updateContactEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
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
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
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
    await assertAdmin(context.userId);
    if (new Date(data.end_date) < new Date(data.start_date)) {
      throw new Error("End date must be on or after start date.");
    }
    const { error } = await supabaseAdmin.from("blocked_dates").insert({
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
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("blocked_dates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
