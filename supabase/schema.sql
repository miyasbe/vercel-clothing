create extension if not exists "pgcrypto";
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_email text not null,
  shipping_address jsonb,
  items jsonb not null,
  total_amount integer not null,
  currency text not null default 'eur',
  stripe_session_id text unique,
  status text not null default 'pending',
  notes text
);
alter table public.orders enable row level security;
create policy "public can insert pending orders" on public.orders
  for insert to anon, authenticated with check (status = 'pending');
-- No select/update policies: only the service role (server routes) reads or updates.

-- Private bucket for artwork (.png .svg .ai .dst). Or: Dashboard > Storage > New bucket "embroidery-artwork" (private).
insert into storage.buckets (id, name, public, file_size_limit)
values ('embroidery-artwork', 'embroidery-artwork', false, 26214400)
on conflict (id) do nothing;
create policy "public can upload artwork" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'embroidery-artwork');
