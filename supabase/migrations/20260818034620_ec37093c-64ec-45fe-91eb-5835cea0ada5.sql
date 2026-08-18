-- Seasonal pricing: weekend base rate + named date-range rate periods.

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS weekend_rate_aud integer NOT NULL DEFAULT 260;

CREATE TABLE IF NOT EXISTS public.rate_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  nightly_rate_aud integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rate_periods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_periods TO authenticated;
GRANT ALL ON public.rate_periods TO service_role;

ALTER TABLE public.rate_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read rate periods"
  ON public.rate_periods FOR SELECT USING (true);

CREATE POLICY "admins can insert rate periods"
  ON public.rate_periods FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update rate periods"
  ON public.rate_periods FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete rate periods"
  ON public.rate_periods FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
