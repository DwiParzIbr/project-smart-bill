-- ====================================================================
-- SMART BILL SUPABASE DATABASE SCHEMA
-- Generated in accordance with Supabase Postgres Best Practices
-- ====================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  phone text,
  email text,
  avatar_color text default 'from-sky-600 to-cyan-500',
  bio text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 2. BILLS TABLE
create table if not exists public.bills (
  id text primary key, -- client generated id e.g. uuid
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  currency text default 'IDR' not null,
  date text not null,
  status text default 'calculated' not null,
  source text default 'manual',
  receipt_image_url text,
  subtotal numeric default 0,
  tax numeric default 0,
  service numeric default 0,
  discount numeric default 0,
  grand_total numeric default 0 not null,
  charges jsonb default '{}'::jsonb not null,
  payers jsonb default '[]'::jsonb,
  raw_bill_data jsonb default '{}'::jsonb,
  raw_result_data jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index for fast user query filtering
create index if not exists idx_bills_user_id on public.bills(user_id);
create index if not exists idx_bills_date on public.bills(date desc);

-- Enable RLS on bills
alter table public.bills enable row level security;

-- Policies for bills:
-- Authenticated users have full control of their own bills
create policy "Users can view their own bills"
  on public.bills for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own bills"
  on public.bills for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own bills"
  on public.bills for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own bills"
  on public.bills for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Anyone can view bill result by bill ID (share link support)
create policy "Anyone can view bill by ID for sharing"
  on public.bills for select
  to anon
  using (true);

-- 3. BILL PARTICIPANTS TABLE
create table if not exists public.bill_participants (
  id text primary key,
  bill_id text references public.bills(id) on delete cascade not null,
  name text not null,
  display_order int default 0,
  phone text,
  payment_status text default 'pending' not null,
  allocated_amount numeric default 0,
  paid_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_bill_participants_bill_id on public.bill_participants(bill_id);

alter table public.bill_participants enable row level security;

create policy "Participants readable by bill owner or anon share"
  on public.bill_participants for select
  using (true);

create policy "Participants editable by bill owner"
  on public.bill_participants for all
  to authenticated
  using (
    exists (
      select 1 from public.bills
      where public.bills.id = public.bill_participants.bill_id
      and public.bills.user_id = (select auth.uid())
    )
  );

-- 4. BILL ITEMS TABLE
create table if not exists public.bill_items (
  id text primary key,
  bill_id text references public.bills(id) on delete cascade not null,
  name text not null,
  quantity numeric default 1 not null,
  unit_price numeric default 0 not null,
  total_price numeric default 0 not null,
  assignments jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_bill_items_bill_id on public.bill_items(bill_id);

alter table public.bill_items enable row level security;

create policy "Items readable by bill owner or anon share"
  on public.bill_items for select
  using (true);

create policy "Items editable by bill owner"
  on public.bill_items for all
  to authenticated
  using (
    exists (
      select 1 from public.bills
      where public.bills.id = public.bill_items.bill_id
      and public.bills.user_id = (select auth.uid())
    )
  );

-- 5. AUTOMATIC TRIGGER FOR NEW AUTH SIGNUPS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email, phone, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'avatar_color', 'from-sky-600 to-cyan-500')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists before re-creating
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
