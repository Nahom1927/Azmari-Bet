create table if not exists public.shop_listings (
  id uuid primary key default gen_random_uuid(),
  seller_name text not null,
  seller_phone text,
  seller_role text default 'seller',
  title text not null,
  category text not null default 'Instrument',
  price_etb numeric(12, 2) not null default 0,
  condition text not null default 'Good',
  description text default '',
  image_url text default '',
  city text default 'Addis Ababa',
  location_label text default '',
  lat double precision,
  lng double precision,
  live_location_active boolean not null default false,
  location_updated_at timestamptz,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.shop_listings(id) on delete cascade,
  thread_key text not null default 'default-buyer',
  sender_name text not null default 'User',
  sender_side text not null default 'buyer',
  body text not null default '',
  shared_lat double precision,
  shared_lng double precision,
  shared_label text default '',
  created_at timestamptz not null default now()
);

alter table public.shop_messages add column if not exists listing_id uuid references public.shop_listings(id) on delete cascade;
alter table public.shop_messages add column if not exists thread_key text not null default 'default-buyer';
alter table public.shop_messages add column if not exists sender_name text not null default 'User';
alter table public.shop_messages add column if not exists sender_side text not null default 'buyer';
alter table public.shop_messages add column if not exists body text not null default '';
alter table public.shop_messages add column if not exists shared_lat double precision;
alter table public.shop_messages add column if not exists shared_lng double precision;
alter table public.shop_messages add column if not exists shared_label text default '';
alter table public.shop_messages add column if not exists created_at timestamptz not null default now();

create index if not exists idx_shop_listings_created on public.shop_listings(created_at desc);
create index if not exists idx_shop_messages_thread on public.shop_messages(listing_id, thread_key, created_at asc);

alter table public.shop_listings enable row level security;
alter table public.shop_messages enable row level security;

drop policy if exists "shop_listings_select_all" on public.shop_listings;
create policy "shop_listings_select_all" on public.shop_listings for select using (true);

drop policy if exists "shop_listings_insert_all" on public.shop_listings;
create policy "shop_listings_insert_all" on public.shop_listings for insert with check (true);

drop policy if exists "shop_listings_update_all" on public.shop_listings;
create policy "shop_listings_update_all" on public.shop_listings for update using (true) with check (true);

drop policy if exists "shop_messages_select_all" on public.shop_messages;
create policy "shop_messages_select_all" on public.shop_messages for select using (true);

drop policy if exists "shop_messages_insert_all" on public.shop_messages;
create policy "shop_messages_insert_all" on public.shop_messages for insert with check (true);

NOTIFY pgrst, 'reload schema';

alter table public.shop_listings add column if not exists verified boolean not null default true;
alter table public.shop_listings add column if not exists icon text default '🎵';

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shop_messages'
  ) then
    alter publication supabase_realtime add table public.shop_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shop_listings'
  ) then
    alter publication supabase_realtime add table public.shop_listings;
  end if;
end $$;

NOTIFY pgrst, 'reload schema';
