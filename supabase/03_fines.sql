-- =====================================================================
-- Hostel Complaint Management System: Supabase schema, part 3 of 3
-- Fines and payments
-- Owner: Member 3 (fines, Razorpay payments, dashboards)
-- Run the three files IN ORDER in Supabase > SQL Editor (01, then 02, then 03).
-- =====================================================================

-- ---------- Fines ----------
create table public.fines (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.public_profiles(id) on delete cascade,
  issued_by           uuid not null references public.public_profiles(id),
  amount              integer not null check (amount between 1 and 10000),
  reason              text not null check (char_length(reason) >= 5),
  complaint_id        uuid references public.complaints(id) on delete set null,
  status              text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  razorpay_order_id   text,
  razorpay_payment_id text unique,
  receipt_no          text,
  method              text
);

create or replace function public.issue_fine(
  p_student uuid, p_amount integer, p_reason text, p_complaint uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  s public.public_profiles;
  c public.complaints;
  fid uuid;
  lbl text;
begin
  if public.my_role() is null or public.my_role() = 'student' then
    raise exception 'Only staff can issue fines.';
  end if;
  select * into s from public.public_profiles where id = p_student and role = 'student';
  if s.id is null then
    raise exception 'Student not found.';
  end if;
  if public.my_role() = 'warden' and s.block is distinct from public.my_block() then
    raise exception 'You can only fine students in your block.';
  end if;
  if p_amount is null or p_amount < 1 or p_amount > 10000 then
    raise exception 'Enter an amount between 1 and 10,000.';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'Describe the reason in at least 5 characters.';
  end if;
  if p_complaint is not null then
    select * into c from public.complaints where id = p_complaint;
    if c.id is null or not public.can_view_complaint(c.student_id, c.route, c.block, c.against_warden_id, c.hide_from_chief) then
      raise exception 'You cannot link this complaint.';
    end if;
  end if;

  insert into public.fines (student_id, issued_by, amount, reason, complaint_id)
  values (p_student, auth.uid(), p_amount, trim(p_reason), p_complaint)
  returning id into fid;

  lbl := public.staff_label();
  insert into public.notifications (user_id, kind, subject, body)
  values (
    p_student, 'fine',
    'Fine issued: ₹' || p_amount,
    'A fine of ₹' || p_amount || ' has been issued by ' || lbl || E'.\n\nReason: ' || trim(p_reason)
      || case when c.id is not null then E'\nRelated complaint: ' || c.code else '' end
      || E'\n\nYou can pay it from the Fines page.'
  );
  return fid;
end $$;

-- Payment confirmation (fires when the verify-payment function marks a fine paid).
create or replace function public.fine_paid() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'unpaid' and new.status = 'paid' then
    insert into public.notifications (user_id, kind, subject, body)
    values (
      new.student_id, 'payment',
      'Payment received: ₹' || new.amount,
      'We received your payment of ₹' || new.amount || ' for "' || new.reason || E'".\n\nReceipt: '
        || coalesce(new.receipt_no, '-') || E'\nPayment ID: ' || coalesce(new.razorpay_payment_id, '-')
    );
  end if;
  return new;
end $$;

create trigger fines_paid
  after update on public.fines
  for each row execute function public.fine_paid();

-- ---------- Row-Level Security: fines ----------
alter table public.fines enable row level security;

create policy "read visible fines" on public.fines
  for select to authenticated
  using (
    student_id = auth.uid()
    or (
      public.my_role() in ('warden', 'chief', 'dean')
      and (complaint_id is null or exists (select 1 from public.complaints c where c.id = fines.complaint_id))
      and (
        public.my_role() <> 'warden'
        or exists (select 1 from public.public_profiles p where p.id = fines.student_id and p.block = public.my_block())
      )
    )
  );
-- No insert/update policies: fines are created by issue_fine() and
-- marked paid only by the verify-payment Edge Function.

grant execute on function public.issue_fine(uuid, integer, text, uuid) to authenticated;
