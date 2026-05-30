import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { format, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { getUnavailableRanges, getNightlyRate, submitBooking } from "@/lib/bookings.functions";

function toISO(d: Date) {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookingWidget() {
  const fetchRanges = useServerFn(getUnavailableRanges);
  const fetchRate = useServerFn(getNightlyRate);
  const submit = useServerFn(submitBooking);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["unavailable-ranges"],
    queryFn: () => fetchRanges(),
  });

  const { data: rateData } = useQuery({
    queryKey: ["nightly-rate"],
    queryFn: () => fetchRate(),
  });
  const nightly = rateData?.rate ?? 260;

  const disabledRanges = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ranges =
      data?.ranges.map((r: { start_date: string; end_date: string }) => {
        const from = new Date(r.start_date);
        const to = new Date(r.end_date);
        to.setDate(to.getDate() - 1);
        return { from, to };
      }) ?? [];
    return [{ before: today }, ...ranges];
  }, [data]);

  const [range, setRange] = useState<DateRange | undefined>();
  const [kind, setKind] = useState<"booking" | "enquiry">("booking");
  const [form, setForm] = useState({ guest_name: "", email: "", phone: "", guests: 2, message: "" });

  const nights = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const total = nights * nightly;

  const valid = nights >= 2 && form.guest_name && form.email;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!range?.from || !range?.to) throw new Error("Select dates");
      return submit({
        data: {
          guest_name: form.guest_name,
          email: form.email,
          phone: form.phone,
          check_in: toISO(range.from),
          check_out: toISO(range.to),
          guests: Number(form.guests),
          message: form.message,
          kind,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(
        kind === "booking"
          ? `Booking received — $${res.total_aud} AUD for ${res.nights} nights. We'll email payment details shortly.`
          : "Enquiry sent — we'll be in touch within 24 hours.",
      );
      setForm({ guest_name: "", email: "", phone: "", guests: 2, message: "" });
      setRange(undefined);
      qc.invalidateQueries({ queryKey: ["booked-ranges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section id="book" className="bg-primary py-24 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] opacity-70">Reserve</p>
          <h2 className="mt-3 text-4xl md:text-5xl">Pick your dates</h2>
          <p className="mt-4 text-base opacity-80">
            Two-night minimum. ${NIGHTLY} AUD per night, grand opening rate.
            Pay the full stay to confirm — or send an enquiry first.
          </p>
        </div>

        <div className="grid gap-10 rounded-2xl bg-card p-6 text-foreground md:grid-cols-[1fr_1fr] md:p-10" style={{ boxShadow: "var(--shadow-lift)" }}>
          <div>
            <DayPicker
              mode="range"
              numberOfMonths={1}
              selected={range}
              onSelect={setRange}
              disabled={disabledRanges}
              min={2}
              className="pointer-events-auto"
              styles={{ caption: { color: "var(--color-primary)" } }}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              Greyed-out dates are unavailable. Select check-in then check-out.
            </p>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              {nights >= 2 && range?.from && range?.to ? (
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-primary">
                      {format(range.from, "EEE d MMM")} → {format(range.to, "EEE d MMM")}
                    </div>
                    <div className="text-muted-foreground">{nights} nights × ${NIGHTLY}</div>
                  </div>
                  <div className="font-display text-2xl text-primary">${total}</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select at least 2 nights to see the total.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Your name">
                <input required value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Guests">
                <select value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} className={inputCls}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Email">
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Phone (optional)">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Anything we should know?">
              <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls} />
            </Field>

            <div className="mt-2 flex gap-3">
              <button
                type="submit"
                disabled={!valid || mutation.isPending}
                onClick={() => setKind("booking")}
                className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                {mutation.isPending && kind === "booking" ? "Booking…" : `Book — $${total || NIGHTLY * 2}`}
              </button>
              <button
                type="submit"
                disabled={!valid || mutation.isPending}
                onClick={() => setKind("enquiry")}
                className="rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
              >
                Send enquiry
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Payment is handled securely. You&apos;ll receive a confirmation email with payment details once your booking is received.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
