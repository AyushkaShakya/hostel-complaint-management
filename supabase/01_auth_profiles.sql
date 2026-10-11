-- =====================================================================
-- Hostel Complaint Management System: Supabase schema, part 1 of 3
-- Accounts, profiles, nicknames and role helpers
-- Owner: Member 1 (authentication and role-based portals)
-- Run the three files IN ORDER in Supabase > SQL Editor (01, then 02, then 03).
-- =====================================================================

-- ---------- Settings (not readable through the API) ----------
create table public.app_settings (
  key   text primary key,
  value text not null
);
alter table public.app_settings enable row level security;
-- No policies: only database functions can read this table.

-- CHANGE THIS CODE before sharing the site. Staff need it to sign up.
insert into public.app_settings (key, value) values ('staff_signup_code', 'HOSTEL-STAFF-2026');

-- ---------- Profiles ----------
-- public_profiles: what other users may see (role, block, nickname, staff name).
-- profiles: private details (real name, email, roll no, room), owner only.
create table public.public_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('student', 'warden', 'chief', 'dean')),
  block      text check (block in ('A', 'B', 'C', 'D')),
  nickname   text,
  staff_name text,
  created_at timestamptz not null default now()
);
create unique index public_profiles_nickname_key on public.public_profiles (lower(nickname));

create table public.profiles (
  id          uuid primary key references public.public_profiles(id) on delete cascade,
  name        text not null,
  email       text not null,
  roll_no     text,
  room        text,
  employee_id text
);

-- ---------- Helper functions ----------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.public_profiles where id = auth.uid()
$$;

create or replace function public.my_block() returns text
language sql stable security definer set search_path = public as $$
  select block from public.public_profiles where id = auth.uid()
$$;

create or replace function public.staff_label() returns text
language sql stable security definer set search_path = public as $$
  select case role
    when 'warden' then 'Warden, Block ' || block
    when 'chief'  then 'Chief Warden'
    when 'dean'   then 'Dean'
    else 'Student' end
  from public.public_profiles where id = auth.uid()
$$;

-- ---------- Create profiles when someone signs up ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r text := coalesce(m->>'role', 'student');
begin
  if r not in ('student', 'warden', 'chief', 'dean') then
    raise exception 'Invalid role';
  end if;
  if r <> 'student' and coalesce(m->>'staff_code', '') <>
     (select value from public.app_settings where key = 'staff_signup_code') then
    raise exception 'Invalid staff access code';
  end if;
  if r in ('student', 'warden') and coalesce(m->>'block', '') not in ('A', 'B', 'C', 'D') then
    raise exception 'Choose a valid block';
  end if;
  if r = 'student' and coalesce(m->>'nickname', '') !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Invalid nickname';
  end if;

  insert into public.public_profiles (id, role, block, nickname, staff_name)
  values (
    new.id, r,
    case when r in ('student', 'warden') then m->>'block' end,
    case when r = 'student' then m->>'nickname' end,
    case when r <> 'student' then m->>'name' end
  );
  insert into public.profiles (id, name, email, roll_no, room, employee_id)
  values (new.id, coalesce(m->>'name', ''), new.email, m->>'roll_no', m->>'room', m->>'employee_id');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Used by the signup form for friendly errors before creating the account.
create or replace function public.nickname_available(p_nickname text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.public_profiles where lower(nickname) = lower(trim(p_nickname)))
$$;

create or replace function public.check_staff_code(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(p_code, '') = (select value from public.app_settings where key = 'staff_signup_code')
$$;

create or replace function public.update_nickname(p_nickname text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'student' then
    raise exception 'Only students have a nickname';
  end if;
  if trim(p_nickname) !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Use 3 to 20 letters, numbers or underscores.';
  end if;
  update public.public_profiles set nickname = trim(p_nickname) where id = auth.uid();
exception when unique_violation then
  raise exception 'That nickname is taken. Choose another one.';
end $$;

-- ---------- Row-Level Security: profiles ----------
alter table public.public_profiles enable row level security;
alter table public.profiles        enable row level security;

-- Staff rows are visible to everyone (students pick a Warden by name).
-- Student rows (nickname + block only) are visible to the student and to staff.
create policy "read public profiles" on public.public_profiles
  for select to authenticated
  using (id = auth.uid() or role <> 'student' or public.my_role() in ('warden', 'chief', 'dean'));

-- Real names, emails, roll numbers and rooms: owner only.
create policy "read own private profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

grant execute on function public.nickname_available(text) to anon, authenticated;
grant execute on function public.check_staff_code(text) to anon, authenticated;
grant execute on function public.update_nickname(text) to authenticated;
