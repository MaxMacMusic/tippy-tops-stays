import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  checkIsAdmin,
  getAdminData,
  updateNightlyRate,
  updateContactEmail,
  addBlockedRange,
  deleteBlockedRange,
  updateBookingStatus,
  deleteBooking,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Owner dashboard — The Sunset Shanty" }] }),
  component: AdminPage,
});

function NotAuthorised({ onSignOut }: { onSignOut: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Toaster richColors position="top-center" />
      <h1 className="font-display text-2xl text-primary">Not authorised</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account is signed in but isn't an admin yet. Ask Lovable to grant admin to your email, then refresh this page.
      </p>
      <div className="flex gap-3">
        <button onClick={onSignOut} className="rounded-full border border-primary px-5 py-2 text-sm text-primary">Sign out</button>
        <Link to="/" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">Home</Link>
      </div>
    </main>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const verifyAdmin = useServerFn(checkIsAdmin);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login", replace: true });
    });
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data.user) navigate({ to: "/login", replace: true });
      else setReady(true);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const adminCheck = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => verifyAdmin(),
    enabled: ready,
    retry: false,
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  if (!ready || adminCheck.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (adminCheck.error || !adminCheck.data?.isAdmin) {
    return <NotAuthorised onSignOut={signOut} />;
  }

  return <Dashboard />;
}


function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchData = useServerFn(getAdminData);
  const setRate = useServerFn(updateNightlyRate);
  const setEmail = useServerFn(updateContactEmail);
  const addBlock = useServerFn(addBlockedRange);
  const delBlock = useServerFn(deleteBlockedRange);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => fetchData(),
    retry: false,
  });

  const [rateInput, setRateInput] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    if (data?.rate) setRateInput(String(data.rate));
    if (data?.contactEmail) setEmailInput(data.contactEmail);
  }, [data?.rate, data?.contactEmail]);

  const rateMut = useMutation({
    mutationFn: (rate: number) => setRate({ data: { rate } }),
    onSuccess: () => {
      toast.success("Nightly rate updated.");
      qc.invalidateQueries({ queryKey: ["admin-data"] });
      qc.invalidateQueries({ queryKey: ["nightly-rate"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const emailMut = useMutation({
    mutationFn: (email: string) => setEmail({ data: { email } }),
    onSuccess: () => {
      toast.success("Enquiries email updated.");
      qc.invalidateQueries({ queryKey: ["admin-data"] });
      qc.invalidateQueries({ queryKey: ["contact-email"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMut = useMutation({
    mutationFn: () =>
      addBlock({ data: { start_date: blockStart, end_date: blockEnd, reason: blockReason || undefined } }),
    onSuccess: () => {
      toast.success("Dates blocked.");
      setBlockStart(""); setBlockEnd(""); setBlockReason("");
      qc.invalidateQueries({ queryKey: ["admin-data"] });
      qc.invalidateQueries({ queryKey: ["unavailable-ranges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delBlock({ data: { id } }),
    onSuccess: () => {
      toast.success("Block removed.");
      qc.invalidateQueries({ queryKey: ["admin-data"] });
      qc.invalidateQueries({ queryKey: ["unavailable-ranges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: string }) => setStatus({ data: v }),
    onSuccess: () => {
      toast.success("Booking updated.");
      qc.invalidateQueries({ queryKey: ["admin-data"] });
      qc.invalidateQueries({ queryKey: ["unavailable-ranges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delBookingMut = useMutation({
    mutationFn: (id: string) => delBooking({ data: { id } }),
    onSuccess: () => {
      toast.success("Booking deleted.");
      setPendingDelete(null);
      qc.invalidateQueries({ queryKey: ["admin-data"] });
      qc.invalidateQueries({ queryKey: ["unavailable-ranges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });



  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Toaster richColors position="top-center" />
        <h1 className="font-display text-2xl text-primary">Not authorised</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your account is signed in but isn't an admin yet. Ask Lovable to grant admin to your email, then refresh this page.
        </p>
        <div className="flex gap-3">
          <button onClick={signOut} className="rounded-full border border-primary px-5 py-2 text-sm text-primary">Sign out</button>
          <Link to="/" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Owner dashboard</p>
            <h1 className="mt-2 font-display text-4xl text-primary">The Sunset Shanty</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-full border border-border px-4 py-2 text-xs">View site</Link>
            <button onClick={signOut} className="rounded-full border border-border px-4 py-2 text-xs">Sign out</button>
          </div>
        </div>

        {/* Nightly rate */}
        <section className="mb-8 rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-display text-xl text-primary">Nightly rate</h2>
          <p className="mt-1 text-sm text-muted-foreground">The price shown on the booking form (AUD).</p>
          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(rateInput);
              if (!Number.isFinite(n) || n < 1) return toast.error("Enter a valid rate.");
              rateMut.mutate(n);
            }}
          >
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">$ per night</span>
              <input type="number" min={1} value={rateInput} onChange={(e) => setRateInput(e.target.value)}
                className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <button type="submit" disabled={rateMut.isPending}
              className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-40">
              {rateMut.isPending ? "Saving…" : "Save rate"}
            </button>
            <span className="text-sm text-muted-foreground">Current: ${data.rate}</span>
          </form>
        </section>

        {/* Enquiries email */}
        <section className="mb-8 rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-display text-xl text-primary">Enquiries email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The public email shown in the site footer for guest enquiries. Separate from your owner login.
          </p>
          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!emailInput.includes("@")) return toast.error("Enter a valid email.");
              emailMut.mutate(emailInput);
            }}
          >
            <label className="block flex-1 min-w-[260px]">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Public email</span>
              <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <button type="submit" disabled={emailMut.isPending}
              className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-40">
              {emailMut.isPending ? "Saving…" : "Save email"}
            </button>
            <span className="text-sm text-muted-foreground">Current: {data.contactEmail}</span>
          </form>
        </section>

        {/* Blocked dates */}
        <section className="mb-8 rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-display text-xl text-primary">Block dates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mark dates unavailable for booking (personal use, maintenance, off-platform stays). Start and end are both included.
          </p>
          <form
            className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              if (!blockStart || !blockEnd) return toast.error("Pick a start and end date.");
              addMut.mutate();
            }}
          >
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">From</span>
              <input required type="date" value={blockStart} onChange={(e) => setBlockStart(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">To</span>
              <input required type="date" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Reason (optional)</span>
              <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Maintenance, family stay…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <button type="submit" disabled={addMut.isPending}
              className="self-end rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-40">
              {addMut.isPending ? "Adding…" : "Block dates"}
            </button>
          </form>

          <div className="mt-6">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Current blocks</h3>
            {data.blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blocked dates.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {data.blocks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-primary">
                        {format(new Date(b.start_date), "EEE d MMM yyyy")} → {format(new Date(b.end_date), "EEE d MMM yyyy")}
                      </div>
                      {b.reason && <div className="text-xs text-muted-foreground">{b.reason}</div>}
                    </div>
                    <button onClick={() => delMut.mutate(b.id)} disabled={delMut.isPending}
                      className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Bookings */}
        <section className="rounded-2xl bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-display text-xl text-primary">Bookings & enquiries</h2>
          {data.bookings.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-md border border-border">
              {data.bookings.map((b) => (
                <li key={b.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-primary">{b.guest_name}</div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs uppercase tracking-wider text-secondary-foreground">
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(b.check_in), "d MMM")} → {format(new Date(b.check_out), "d MMM yyyy")}
                    {" · "}{b.nights} nights · ${b.total_aud} · {b.guests} guests
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {b.email}{b.phone ? ` · ${b.phone}` : ""}
                  </div>
                  {b.message && <div className="mt-1 text-xs italic text-muted-foreground">"{b.message}"</div>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
