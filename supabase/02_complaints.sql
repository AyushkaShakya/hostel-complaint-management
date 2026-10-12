-- =====================================================================
-- Hostel Complaint Management System: Supabase schema, part 2 of 3
-- Complaints, routing, status history and notifications
-- Owner: Member 2 (complaints, routing, status tracking, notifications)
-- Run the three files IN ORDER in Supabase > SQL Editor (01, then 02, then 03).
-- =====================================================================

-- ---------- Visibility helper ----------
-- The visibility rules from the synopsis, in one place.
create or replace function public.can_view_complaint(
  p_student uuid, p_route text, p_block text, p_against uuid, p_hide boolean
) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.my_role()
    when 'student' then p_student = auth.uid()
    when 'warden'  then p_route = 'warden' and p_block = public.my_block()
                        and p_against is distinct from auth.uid()
    when 'chief'   then p_route in ('warden', 'bypass') or (p_route = 'dean' and not p_hide)
    when 'dean'    then true
    else false
  end
$$;

-- ---------- Complaints ----------
create sequence public.complaint_code_seq start 1001;

create table public.complaints (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique default ('HC-' || nextval('public.complaint_code_seq')),
  student_id        uuid not null references public.public_profiles(id) on delete cascade,
  category          text not null check (category in (
                      'washroom', 'electricity', 'wifi', 'water', 'plumbing', 'mess',
                      'cleanliness', 'furniture', 'pest', 'security',
                      'against_warden', 'ragging')),
  title             text not null check (char_length(title) between 5 and 90),
  description       text not null check (char_length(description) >= 20),
  location          text not null default '',
  route             text not null default 'warden' check (route in ('warden', 'bypass', 'dean')),
  block             text not null default 'A',
  against_warden_id uuid references public.public_profiles(id),
  hide_from_chief   boolean not null default false,
  status            text not null default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.complaint_history (
  id           bigint generated always as identity primary key,
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  status       text not null,
  note         text not null default '',
  by_label     text not null,
  created_at   timestamptz not null default now()
);

-- Routing is decided here, on the server, never by the browser.
create or replace function public.route_complaint() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  s public.public_profiles;
begin
  select * into s from public.public_profiles where id = auth.uid();
  if s.role is distinct from 'student' then
    raise exception 'Only students can file complaints';
  end if;

  new.student_id := s.id;
  new.block      := s.block;
  new.status     := 'pending';
  new.created_at := now();
  new.updated_at := now();
  new.route := case new.category
                 when 'against_warden' then 'bypass'
                 when 'ragging'        then 'dean'
                 else 'warden' end;

  if new.route = 'bypass' then
    if not exists (select 1 from public.public_profiles where id = new.against_warden_id and role = 'warden') then
      raise exception 'Choose the Warden this complaint is about.';
    end if;
  else
    new.against_warden_id := null;
  end if;
  if new.route <> 'dean' then
    new.hide_from_chief := false;
  end if;
  return new;
end $$;

create trigger complaints_route
  before insert on public.complaints
  for each row execute function public.route_complaint();

create or replace function public.complaint_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.complaint_history (complaint_id, status, note, by_label)
  values (new.id, 'pending', '', 'Student');
  return new;
end $$;

create trigger complaints_created
  after insert on public.complaints
  for each row execute function public.complaint_created();

-- ---------- Notifications (the in-app "Email inbox") ----------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.public_profiles(id) on delete cascade,
  kind       text not null check (kind in ('status', 'fine', 'payment')),
  subject    text not null,
  body       text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Status updates (staff only) ----------
create or replace function public.update_complaint_status(
  p_complaint uuid, p_status text, p_note text default ''
) returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.complaints;
  lbl text;
  status_label text;
  clean_note text := coalesce(trim(p_note), '');
begin
  if public.my_role() is null or public.my_role() = 'student' then
    raise exception 'Only staff can update complaints.';
  end if;
  select * into c from public.complaints where id = p_complaint;
  if c.id is null or not public.can_view_complaint(c.student_id, c.route, c.block, c.against_warden_id, c.hide_from_chief) then
    raise exception 'You do not have permission to update this complaint.';
  end if;
  if p_status not in ('pending', 'in_progress', 'resolved') then
    raise exception 'Invalid status.';
  end if;
  if p_status = c.status and clean_note = '' then
    raise exception 'Choose a different status or add a note for the student.';
  end if;

  lbl := public.staff_label();
  status_label := case p_status when 'pending' then 'Pending' when 'in_progress' then 'In Progress' else 'Resolved' end;

  update public.complaints set status = p_status, updated_at = now() where id = c.id;
  insert into public.complaint_history (complaint_id, status, note, by_label)
  values (c.id, p_status, clean_note, lbl);
  insert into public.notifications (user_id, kind, subject, body)
  values (
    c.student_id, 'status',
    c.code || ' is now ' || status_label,
    'Your complaint "' || c.title || '" was moved to ' || status_label || ' by ' || lbl || '.'
      || case when clean_note <> '' then E'\n\nNote: ' || clean_note else '' end
  );
end $$;

-- ---------- Row-Level Security: complaints and notifications ----------
alter table public.complaints        enable row level security;
alter table public.complaint_history enable row level security;
alter table public.notifications     enable row level security;

create policy "read visible complaints" on public.complaints
  for select to authenticated
  using (public.can_view_complaint(student_id, route, block, against_warden_id, hide_from_chief));

create policy "students file complaints" on public.complaints
  for insert to authenticated
  with check (public.my_role() = 'student');
-- No update/delete policies: status changes go through update_complaint_status().

create policy "read history of visible complaints" on public.complaint_history
  for select to authenticated
  using (exists (select 1 from public.complaints c where c.id = complaint_id));

create policy "read own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "mark own notifications read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant execute on function public.update_complaint_status(uuid, text, text) to authenticated;
