-- 1. Profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users read own profile" on profiles
  for select using (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins read all profiles" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- 2. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Admin function: list all users with their data stats
create or replace function admin_get_all_users()
returns json as $$
begin
  -- Check if caller is admin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Not authorized';
  end if;

  return (
    select json_agg(row_to_json(u))
    from (
      select
        p.id,
        p.email,
        p.is_admin,
        p.created_at,
        (select count(*) from categories c where c.user_id = p.id) as categories_count,
        (select count(*) from tasks t where t.user_id = p.id) as tasks_count,
        (select count(*) from tasks t where t.user_id = p.id and t.completed = true) as completed_tasks_count,
        (select count(*) from days d where d.user_id = p.id) as days_count
      from profiles p
      order by p.created_at desc
    ) u
  );
end;
$$ language plpgsql security definer;
