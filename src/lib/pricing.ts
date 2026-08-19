export type RatePeriod = {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  nightly_rate_aud: number;
};

export type NightLine = {
  date: string;
  rate: number;
  label: string;
};

export type Quote = {
  nights: number;
  lines: NightLine[];
  subtotal: number;
  discount: number;
  total: number;
};

function parseISO(d: string): Date {
  return new Date(`${d}T00:00:00`);
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function spanDays(p: RatePeriod): number {
  return Math.round(
    (parseISO(p.end_date).getTime() - parseISO(p.start_date).getTime()) / 86400000,
  );
}

/** Rate for a single night. Narrowest matching special period wins, else weekend/midweek. */
export function rateForNight(
  dateISO: string,
  midweekRate: number,
  weekendRate: number,
  periods: RatePeriod[] = [],
): { rate: number; label: string } {
  const t = parseISO(dateISO).getTime();
  const matches = periods.filter(
    (p) => parseISO(p.start_date).getTime() <= t && parseISO(p.end_date).getTime() >= t,
  );
  if (matches.length > 0) {
    const best = matches.reduce((a, b) => (spanDays(b) < spanDays(a) ? b : a));
    return { rate: best.nightly_rate_aud, label: best.name };
  }
  const dow = parseISO(dateISO).getDay(); // 0 Sun … 6 Sat
  if (dow === 5 || dow === 6) return { rate: weekendRate, label: "Weekend" };
  return { rate: midweekRate, label: "Midweek" };
}

/** Price a stay night by night. check_out is not charged. */
export function quoteStay(args: {
  check_in: string;
  check_out: string;
  midweekRate: number;
  weekendRate: number;
  periods?: RatePeriod[];
}): Quote {
  const { check_in, check_out, midweekRate, weekendRate, periods = [] } = args;
  const start = parseISO(check_in);
  const end = parseISO(check_out);
  const nights = Math.round((end.getTime() - start.getTime()) / 86400000);

  const lines: NightLine[] = [];
  for (let i = 0; i < Math.max(nights, 0); i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = toISO(d);
    const { rate, label } = rateForNight(iso, midweekRate, weekendRate, periods);
    lines.push({ date: iso, rate, label });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.rate, 0);
  return { nights, lines, subtotal, discount: 0, total: subtotal };
}

