
GRANT SELECT, UPDATE, DELETE ON public.bookings TO authenticated;

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bookings" ON public.bookings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT EXECUTE ON FUNCTION public.get_unavailable_ranges() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_booked_ranges() TO anon, authenticated;
