ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS min_two_nights;
ALTER TABLE public.bookings ADD CONSTRAINT min_one_night CHECK (check_out > check_in);