-- AZMARI MUSIC ACADEMY: instructor-managed curriculum progress
-- Run once in Supabase Dashboard > SQL Editor using the project's owner account.
-- Students can read their own progress only through academy_v2_my_course_progress().
-- Teachers/admins can read and update records through the staff RPCs.

create table if not exists public.academy_course_progress (
  student_no text primary key,
  major text not null default '',
  completed_weeks smallint[] not null default '{}',
  instructor_note text,
  level1_exam_score numeric(5,2),
  level2_exam_score numeric(5,2),
  final_exam_score numeric(5,2),
  updated_by uuid,
  updated_at timestamptz not null default now(),
  constraint academy_exam_scores_valid check (
    (level1_exam_score is null or level1_exam_score between 0 and 100) and
    (level2_exam_score is null or level2_exam_score between 0 and 100) and
    (final_exam_score is null or final_exam_score between 0 and 100)
  ),
  constraint academy_completed_weeks_valid check (
    completed_weeks <@ array[
      1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,
      25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48
    ]::smallint[]
  )
);

alter table public.academy_course_progress add column if not exists level1_exam_score numeric(5,2);
alter table public.academy_course_progress add column if not exists level2_exam_score numeric(5,2);
alter table public.academy_course_progress add column if not exists final_exam_score numeric(5,2);

alter table public.academy_course_progress enable row level security;
revoke all on public.academy_course_progress from anon, authenticated;

create or replace function public.academy_v2_staff_get_course_progress(p_student_no text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_role text; v_row public.academy_course_progress%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  v_role := to_jsonb(public.my_role())->>'role';
  if coalesce(v_role,'') not in ('teacher','admin') then raise exception 'Instructor or admin access required'; end if;
  select * into v_row from public.academy_course_progress where student_no = p_student_no;
  if not found then
    return jsonb_build_object('student_no',p_student_no,'major','','completed_weeks','[]'::jsonb,'instructor_note',null);
  end if;
  return jsonb_build_object('student_no',v_row.student_no,'major',v_row.major,'completed_weeks',to_jsonb(v_row.completed_weeks),'instructor_note',v_row.instructor_note,'level1_exam_score',v_row.level1_exam_score,'level2_exam_score',v_row.level2_exam_score,'final_exam_score',v_row.final_exam_score,'updated_at',v_row.updated_at);
end; $$;

create or replace function public.academy_v2_staff_set_course_progress(
  p_student_no text, p_major text, p_completed_weeks smallint[], p_note text default null,
  p_level1_exam_score numeric default null, p_level2_exam_score numeric default null, p_final_exam_score numeric default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_role text; v_weeks smallint[];
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  v_role := to_jsonb(public.my_role())->>'role';
  if coalesce(v_role,'') not in ('teacher','admin') then raise exception 'Instructor or admin access required'; end if;
  v_weeks := coalesce(p_completed_weeks,'{}'::smallint[]);
  if exists (select 1 from unnest(v_weeks) as u(week_no) where u.week_no < 1 or u.week_no > 48) then raise exception 'Week numbers must be between 1 and 48'; end if;
  if (p_level1_exam_score is not null and (p_level1_exam_score < 0 or p_level1_exam_score > 100)) or (p_level2_exam_score is not null and (p_level2_exam_score < 0 or p_level2_exam_score > 100)) or (p_final_exam_score is not null and (p_final_exam_score < 0 or p_final_exam_score > 100)) then raise exception 'Exam scores must be between 0 and 100'; end if;
  insert into public.academy_course_progress(student_no,major,completed_weeks,instructor_note,level1_exam_score,level2_exam_score,final_exam_score,updated_by,updated_at)
  values (p_student_no,coalesce(nullif(trim(p_major),''),''),array(select distinct u.week_no from unnest(v_weeks) as u(week_no) order by u.week_no),p_note,p_level1_exam_score,p_level2_exam_score,p_final_exam_score,auth.uid(),now())
  on conflict (student_no) do update set major=excluded.major,completed_weeks=excluded.completed_weeks,instructor_note=excluded.instructor_note,level1_exam_score=coalesce(excluded.level1_exam_score,public.academy_course_progress.level1_exam_score),level2_exam_score=coalesce(excluded.level2_exam_score,public.academy_course_progress.level2_exam_score),final_exam_score=coalesce(excluded.final_exam_score,public.academy_course_progress.final_exam_score),updated_by=excluded.updated_by,updated_at=now();
  return public.academy_v2_staff_get_course_progress(p_student_no);
end; $$;

create or replace function public.academy_v2_my_course_progress()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_student jsonb; v_no text; v_row public.academy_course_progress%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  v_student := to_jsonb(public.my_progress());
  v_no := v_student->>'student_no';
  if v_no is null or v_no = '' then raise exception 'Student account is not linked'; end if;
  select * into v_row from public.academy_course_progress where student_no = v_no;
  if not found then
    return jsonb_build_object('student_no',v_no,'major',coalesce(v_student->>'instrument',''),'completed_weeks','[]'::jsonb,'instructor_note',null);
  end if;
  return jsonb_build_object('student_no',v_no,'major',coalesce(nullif(v_row.major,''),v_student->>'instrument',''),'completed_weeks',to_jsonb(v_row.completed_weeks),'instructor_note',v_row.instructor_note,'level1_exam_score',v_row.level1_exam_score,'level2_exam_score',v_row.level2_exam_score,'final_exam_score',v_row.final_exam_score,'updated_at',v_row.updated_at);
end; $$;

revoke all on function public.academy_v2_staff_get_course_progress(text) from public;
revoke all on function public.academy_v2_staff_set_course_progress(text,text,smallint[],text,numeric,numeric,numeric) from public;
revoke all on function public.academy_v2_my_course_progress() from public;
grant execute on function public.academy_v2_staff_get_course_progress(text) to authenticated;
grant execute on function public.academy_v2_staff_set_course_progress(text,text,smallint[],text,numeric,numeric,numeric) to authenticated;
grant execute on function public.academy_v2_my_course_progress() to authenticated;
