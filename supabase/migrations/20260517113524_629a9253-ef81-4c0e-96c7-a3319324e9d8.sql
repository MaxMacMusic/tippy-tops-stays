create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  email text not null,
  phone text,
  check_in date not null,
  check_out date not null,
  guests int not null default 2,
  nights int not null,
  total_aud int not null,
  message text,
  status text not null default 'pending',
  stripe_session_id text,
  created_at timestamptz not null default now(),
  constraint min_two_nights check (check_out - check_in >= 2),
  constraint valid_dates check (check_out > check_in)
);

alter table public.bookings enable row level security;

-- Anyone can submit a booking
create policy "anyone can insert booking"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

-- No public select on the table itself (PII protection)

-- Public function returning only date ranges of active bookings
create or replace function public.get_booked_ranges()
returns table(check_in date, check_out date)
language sql
security definer
stable
set search_path = public
as $$
  select check_in, check_out
  from public.bookings
  where status in ('pending', 'paid', 'confirmed')
    and check_out >= current_date;
$$;

grant execute on function public.get_booked_ranges() to anon, authenticated;