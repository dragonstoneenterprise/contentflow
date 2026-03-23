-- ============================================
-- ContentFlow: Supabase Setup
-- Run this in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste > Run
-- ============================================

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text default 'free' check (plan in ('free', 'pro')),
  daily_usage integer default 0,
  total_usage integer default 0,
  last_reset date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. RLS Policies — users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 4. Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, plan, daily_usage, total_usage, last_reset)
  values (
    new.id,
    new.email,
    'free',
    0,
    0,
    current_date
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists (safe re-run)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Updated_at auto-update
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- 6. Index for fast lookups
create index if not exists idx_profiles_plan on public.profiles(plan);
create index if not exists idx_profiles_email on public.profiles(email);

-- Done! Your profiles table is ready.
-- Next: Enable Google OAuth in Supabase Dashboard > Authentication > Providers > Google
