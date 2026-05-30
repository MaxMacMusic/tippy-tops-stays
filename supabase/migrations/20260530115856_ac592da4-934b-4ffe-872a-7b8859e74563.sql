
-- Roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "users can view their own roles"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Site settings (singleton)
create table public.settings (
  id int primary key default 1,
  nightly_rate_aud int not null default 260,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

grant select on public.settings to anon, authenticated;
grant all on public.settings to service_role;

alter table public.settings enable row level security;

create policy "anyone can read settings"
on public.settings for select
using (true);

create policy "admins can insert settings"
on public.settings for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "admins can update settings"
on public.settings for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.settings (id, nightly_rate_aud) values (1, 260);

-- Blocked date ranges (owner-marked unavailability)
create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint blocked_dates_range check (end_date >= start_date)
);

grant select on public.blocked_dates to anon, authenticated;
grant insert, delete on public.blocked_dates to authenticated;
grant all on public.blocked_dates to service_role;

alter table public.blocked_dates enable row level security;

create policy "anyone can read blocked dates"
on public.blocked_dates for select
using (true);

create policy "admins can insert blocked dates"
on public.blocked_dates for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "admins can delete blocked dates"
on public.blocked_dates for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Combined unavailable ranges (bookings + blocks), check_out/end exclusive
create or replace function public.get_unavailable_ranges()
returns table(start_date date, end_date date)
language sql
stable
security definer
set search_path = public
as $$
  select check_in as start_date, check_out as end_date
  from public.bookings
  where status in ('pending', 'paid', 'confirmed')
    and check_out >= current_date
  union all
  select start_date, (end_date + 1) as end_date
  from public.blocked_dates
  where end_date >= current_date;
$$;
