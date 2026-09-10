CREATE OR REPLACE FUNCTION public.create_booking(p_guest_name text, p_email text, p_phone text, p_check_in date, p_check_out date, p_guests integer, p_nights integer, p_total_aud integer, p_message text, p_status text)
RETURNS TABLE(id uuid, nights integer, total_aud integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_overlap boolean;
BEGIN
  IF p_nights < 1 THEN
    RAISE EXCEPTION 'MIN_NIGHTS';
  END IF;

  IF p_guests < 1 OR p_guests > 2 THEN
    RAISE EXCEPTION 'INVALID_GUESTS';
  END IF;

  IF p_status NOT IN ('pending', 'enquiry') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.get_unavailable_ranges() r
    WHERE r.start_date < p_check_out AND r.end_date > p_check_in
  ) INTO v_overlap;

  IF v_overlap THEN
    RAISE EXCEPTION 'UNAVAILABLE';
  END IF;

  RETURN QUERY
  INSERT INTO public.bookings (
    guest_name, email, phone, check_in, check_out,
    guests, nights, total_aud, message, status
  )
  VALUES (
    p_guest_name, p_email, p_phone, p_check_in, p_check_out,
    p_guests, p_nights, p_total_aud, p_message, p_status
  )
  RETURNING bookings.id, bookings.nights, bookings.total_aud;
END;
$function$;