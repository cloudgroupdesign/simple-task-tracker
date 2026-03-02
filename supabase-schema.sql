-- Run this in your Supabase SQL Editor (supabase.com > project > SQL Editor)

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  base_type text check (base_type in ('work', 'rest')) not null,
  created_at timestamptz default now()
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  category_id uuid references categories(id) on delete set null,
  date date,
  completed boolean default false,
  is_inbox boolean default false,
  created_at timestamptz default now()
);

-- Days
create table days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  category_id uuid references categories(id) on delete cascade not null,
  reflection_done boolean default false,
  briefing_seen boolean default false,
  unique(user_id, date)
);

-- Row Level Security
alter table categories enable row level security;
alter table tasks enable row level security;
alter table days enable row level security;

create policy "Users manage own categories" on categories
  for all using (auth.uid() = user_id);

create policy "Users manage own tasks" on tasks
  for all using (auth.uid() = user_id);

create policy "Users manage own days" on days
  for all using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table categories, tasks, days;
