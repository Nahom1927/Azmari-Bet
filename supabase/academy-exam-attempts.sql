-- AZMARI MUSIC ACADEMY: saved student exam attempts (self-check papers in the portal)
-- Run once in Supabase Dashboard > SQL Editor. Safe to run again.
-- Needs public.my_role() and public.my_progress() (already used by academy-progress.sql).
-- Students can only add and read their OWN attempts through the RPCs below.
-- Teachers/admins can read every attempt. These are practice results, not official exam scores.

create table if not exists public.academy_exam_attempts (
  id bigint generated always as identity primary key,
  student_no text not null,
  exam_id text not null check (exam_id in ('l1','l2','fin')),
  right_count smallint not null check (right_count >= 0),
  total smallint not null check (total between 1 and 100),
  pct numeric(5,2) not null,
  missed jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint academy_exam_attempt_range check (right_count <= total)
);
create index if not exists academy_exam_attempts_student_idx on public.academy_exam_attempts (student_no, created_at desc);
alter table public.academy_exam_attempts enable row level security;
revoke all on public.academy_exam_attempts from anon, authenticated;

create or replace function public.academy_submit_exam_attempt(p_exam_id text, p_right integer, p_total integer, p_missed jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_student jsonb; v_no text; v_id bigint; v_missed jsonb := coalesce(p_missed,'[]'::jsonb);
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  v_student := to_jsonb(public.my_progress());
  v_no := v_student->>'student_no';
  if v_no is null or v_no = '' then raise exception 'Student account is not linked'; end if;
  if p_exam_id not in ('l1','l2','fin') then raise exception 'Unknown exam'; end if;
  if p_total < 1 or p_total > 100 or p_right < 0 or p_right > p_total then raise exception 'Invalid score'; end if;
  if jsonb_typeof(v_missed) <> 'array' or jsonb_array_length(v_missed) > 100 then raise exception 'Invalid detail'; end if;
  if exists (select 1 from public.academy_exam_attempts where student_no = v_no and exam_id = p_exam_id and created_at > now() - interval '20 seconds') then
    raise exception 'Please wait a moment before submitting again';
  end if;
  insert into public.academy_exam_attempts(student_no, exam_id, right_count, total, pct, missed)
  values (v_no, p_exam_id, p_right, p_total, round(p_right::numeric * 100 / p_total, 2), v_missed)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'student_no', v_no);
end; $$;

create or replace function public.academy_my_exam_attempts()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_no text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  v_no := to_jsonb(public.my_progress())->>'student_no';
  if v_no is null or v_no = '' then raise exception 'Student account is not linked'; end if;
  return coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc) from (
    select id, exam_id, right_count, total, pct, created_at from public.academy_exam_attempts
    where student_no = v_no order by created_at desc limit 50) t), '[]'::jsonb);
end; $$;

create or replace function public.academy_staff_list_exam_attempts(p_student_no text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_role text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  v_role := to_jsonb(public.my_role())->>'role';
  if coalesce(v_role,'') not in ('teacher','admin') then raise exception 'Instructor or admin access required'; end if;
  return coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc) from (
    select id, student_no, exam_id, right_count, total, pct, missed, created_at from public.academy_exam_attempts
    where p_student_no is null or student_no = p_student_no order by created_at desc limit 500) t), '[]'::jsonb);
end; $$;

revoke all on function public.academy_submit_exam_attempt(text,integer,integer,jsonb) from public;
revoke all on function public.academy_my_exam_attempts() from public;
revoke all on function public.academy_staff_list_exam_attempts(text) from public;
grant execute on function public.academy_submit_exam_attempt(text,integer,integer,jsonb) to authenticated;
grant execute on function public.academy_my_exam_attempts() to authenticated;
grant execute on function public.academy_staff_list_exam_attempts(text) to authenticated;

notify pgrst, 'reload schema';
