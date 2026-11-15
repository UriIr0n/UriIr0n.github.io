-- =====================================================================
-- מערכת משוב · הנדסת תעשייה וניהול
-- להרצה פעם אחת ב-Supabase SQL Editor.
--
-- עקרון מנחה: הדפדפן מחזיק מפתח anon ציבורי. מה שמגן על הנתונים הוא
-- RLS בלבד — לא סודיות המפתח. לכן כל מדיניות כאן נכתבה בהנחה שתוקף
-- מחזיק את המפתח ויכול לשלוח כל בקשה שירצה.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. טבלאות
-- ---------------------------------------------------------------------

-- שורה אחת לכל שאלון שהושלם. אין כאן שום מזהה אישי.
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  cohort        text not null check (cohort in ('year3','year4','alumni')),
  track         text          check (track  in ('info','production','other')),
  miluim        boolean not null default false,

  -- מדד מוכנות: הערכה עצמית 1-5
  r_sql           smallint check (r_sql           between 1 and 5),
  r_python        smallint check (r_python        between 1 and 5),
  r_simulation    smallint check (r_simulation    between 1 and 5),
  r_deterministic smallint check (r_deterministic between 1 and 5),
  r_excel         smallint check (r_excel         between 1 and 5),
  r_projects      smallint check (r_projects      between 1 and 5),
  r_stats         smallint check (r_stats         between 1 and 5),
  r_interviews    smallint check (r_interviews    between 1 and 5),

  -- חומרת הבעיה לפי נושא 1-5 (1 = לא בעיה, 5 = בעיה חמורה)
  t_courses_outdated smallint check (t_courses_outdated between 1 and 5),
  t_final_project    smallint check (t_final_project    between 1 and 5),
  t_dept_attitude    smallint check (t_dept_attitude    between 1 and 5),
  t_industry_link    smallint check (t_industry_link    between 1 and 5),
  t_teaching_quality smallint check (t_teaching_quality between 1 and 5),
  t_regulations      smallint check (t_regulations      between 1 and 5),
  t_miluim_gpa       smallint check (t_miluim_gpa       between 1 and 5),

  overall_ready    smallint check (overall_ready    between 1 and 5),
  would_recommend  smallint check (would_recommend  between 1 and 5)
);

-- משפטים חופשיים. מכוון: אין כאן submission_id.
-- קישור בין משפט לתשובות הכמותיות היה מאפשר לזהות אדם במחזור קטן
-- (שנה ד' + מסלול + מילואים + זמן = אדם אחד). הניתוק הזה הוא התכונה.
create table if not exists public.quotes (
  id           bigint generated always as identity primary key,
  -- תאריך בלבד, לא חותמת זמן: שעה מדויקת מאפשרת קורלציה לשורת submissions
  created_on   date not null default current_date,
  body         text not null check (char_length(btrim(body)) between 15 and 400),
  theme        text check (theme in ('courses','project','attitude','industry','teaching','regulations','miluim','other')),
  cohort       text check (cohort in ('year3','year4','alumni')),
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  endorsements integer not null default 0,
  moderated_at timestamptz,
  moderator_note text
);

create index if not exists quotes_public_idx on public.quotes (status, endorsements desc);

-- חיזוקים: "גם אני חוויתי את זה".
-- device_id הוא UUID אקראי מ-localStorage. הוא לא מזהה אדם — הוא רק
-- מונע הצבעה כפולה מאותו דפדפן.
create table if not exists public.quote_endorsements (
  quote_id   bigint not null references public.quotes(id) on delete cascade,
  device_id  uuid   not null,
  created_on date   not null default current_date,
  primary key (quote_id, device_id)
);

-- ---------------------------------------------------------------------
-- 2. טריגרים
-- ---------------------------------------------------------------------

-- כפיית pending בכתיבה. בלי זה, בקשה מזויפת עם "status":"approved"
-- הייתה מפרסמת טקסט לקיר בלי מודרציה.
create or replace function public.quotes_force_pending()
returns trigger language plpgsql as $$
begin
  new.status       := 'pending';
  new.endorsements := 0;
  new.created_on   := current_date;
  new.moderated_at := null;
  new.moderator_note := null;
  return new;
end $$;

drop trigger if exists quotes_force_pending_trg on public.quotes;
create trigger quotes_force_pending_trg
  before insert on public.quotes
  for each row execute function public.quotes_force_pending();

-- ספירת חיזוקים מתוחזקת בשרת. הלקוח לא יכול לכתוב ל-endorsements.
create or replace function public.bump_endorsements()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.quotes set endorsements = endorsements + 1 where id = new.quote_id;
  return new;
end $$;

drop trigger if exists bump_endorsements_trg on public.quote_endorsements;
create trigger bump_endorsements_trg
  after insert on public.quote_endorsements
  for each row execute function public.bump_endorsements();

-- ---------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------

alter table public.submissions        enable row level security;
alter table public.quotes             enable row level security;
alter table public.quote_endorsements enable row level security;

-- submissions: כתיבה בלבד. אין מדיניות select, ולכן קריאה חסומה לחלוטין —
-- גם למשתמש מחובר. הדרך היחידה לראות את הנתונים היא public_stats() המצטברת.
drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions
  for insert to anon, authenticated with check (true);

-- quotes: כל אחד כותב, כל אחד קורא רק מאושרים.
drop policy if exists quotes_insert on public.quotes;
create policy quotes_insert on public.quotes
  for insert to anon, authenticated with check (true);

drop policy if exists quotes_read_approved on public.quotes;
create policy quotes_read_approved on public.quotes
  for select to anon using (status = 'approved');

-- מודרציה: רק המייל המורשה. הרשימה כאן היא מקור האמת.
drop policy if exists quotes_read_moderator on public.quotes;
create policy quotes_read_moderator on public.quotes
  for select to authenticated
  using (auth.jwt() ->> 'email' in ('uriiron20@gmail.com'));

drop policy if exists quotes_update_moderator on public.quotes;
create policy quotes_update_moderator on public.quotes
  for update to authenticated
  using      (auth.jwt() ->> 'email' in ('uriiron20@gmail.com'))
  with check (auth.jwt() ->> 'email' in ('uriiron20@gmail.com'));

-- חיזוקים: כתיבה בלבד. קריאה חסומה כדי שאי אפשר יהיה למפות
-- device_id -> אילו משפטים הוא חיזק.
drop policy if exists endorse_insert on public.quote_endorsements;
create policy endorse_insert on public.quote_endorsements
  for insert to anon, authenticated with check (true);

-- ---------------------------------------------------------------------
-- 4. סטטיסטיקה ציבורית
--
-- security definer: עוקף RLS בכוונה, אבל מחזיר אך ורק ערכים מצטברים.
-- MIN_N: דלי עם פחות מ-5 תשובות מוחזר כ-null. בלי הסף הזה אפשר היה
-- לצמצם פילוח עד לאדם בודד ולקרוא את התשובות שלו.
-- ---------------------------------------------------------------------

create or replace function public.public_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  min_n constant int := 5;
  total int;
  res   jsonb;
begin
  select count(*) into total from public.submissions;

  -- מתחת לסף הכללי לא נחשף כלום מלבד המונה עצמו
  if total < min_n then
    return jsonb_build_object('total', total, 'gated', true, 'min_n', min_n);
  end if;

  select jsonb_build_object(
    'total', total,
    'gated', false,
    'min_n', min_n,

    'cohorts', (
      select coalesce(jsonb_object_agg(cohort, c), '{}'::jsonb)
      from (select cohort, count(*)::int c from public.submissions group by cohort) t
    ),

    'themes', (
      select jsonb_build_object(
        'courses',     round(avg(t_courses_outdated)::numeric, 2),
        'project',     round(avg(t_final_project)::numeric, 2),
        'attitude',    round(avg(t_dept_attitude)::numeric, 2),
        'industry',    round(avg(t_industry_link)::numeric, 2),
        'teaching',    round(avg(t_teaching_quality)::numeric, 2),
        'regulations', round(avg(t_regulations)::numeric, 2),
        'miluim',      round(avg(t_miluim_gpa)::numeric, 2)
      ) from public.submissions
    ),

    -- ממוצע מיומנות לכלל המשיבים ובפילוח מחזור, כל דלי מגודר בנפרד
    'skills', (
      select jsonb_build_object(
        'sql',           round(avg(r_sql)::numeric, 2),
        'python',        round(avg(r_python)::numeric, 2),
        'simulation',    round(avg(r_simulation)::numeric, 2),
        'deterministic', round(avg(r_deterministic)::numeric, 2),
        'excel',         round(avg(r_excel)::numeric, 2),
        'projects',      round(avg(r_projects)::numeric, 2),
        'stats',         round(avg(r_stats)::numeric, 2),
        'interviews',    round(avg(r_interviews)::numeric, 2)
      ) from public.submissions
    ),

    'skills_by_cohort', (
      select coalesce(jsonb_object_agg(cohort, obj), '{}'::jsonb) from (
        select cohort, jsonb_build_object(
          'n',             count(*)::int,
          'sql',           case when count(*) >= min_n then round(avg(r_sql)::numeric, 2) end,
          'python',        case when count(*) >= min_n then round(avg(r_python)::numeric, 2) end,
          'simulation',    case when count(*) >= min_n then round(avg(r_simulation)::numeric, 2) end,
          'deterministic', case when count(*) >= min_n then round(avg(r_deterministic)::numeric, 2) end,
          'excel',         case when count(*) >= min_n then round(avg(r_excel)::numeric, 2) end,
          'projects',      case when count(*) >= min_n then round(avg(r_projects)::numeric, 2) end,
          'stats',         case when count(*) >= min_n then round(avg(r_stats)::numeric, 2) end,
          'interviews',    case when count(*) >= min_n then round(avg(r_interviews)::numeric, 2) end
        ) obj
        from public.submissions group by cohort
      ) t
    ),

    -- התפלגות "עד כמה את/ה מרגיש/ה מוכן/ה", 1..5
    'ready_dist', (
      select coalesce(jsonb_object_agg(overall_ready::text, c), '{}'::jsonb)
      from (select overall_ready, count(*)::int c from public.submissions
            where overall_ready is not null group by overall_ready) t
    ),

    'ready_avg', (select round(avg(overall_ready)::numeric, 2) from public.submissions),

    'quotes_approved', (select count(*)::int from public.quotes where status = 'approved'),
    'endorsements',    (select coalesce(sum(endorsements), 0)::int from public.quotes where status = 'approved')
  ) into res;

  return res;
end $$;

-- ---------------------------------------------------------------------
-- 5. הרשאות
-- ---------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant insert on public.submissions        to anon, authenticated;
grant insert on public.quote_endorsements to anon, authenticated;
grant insert, select on public.quotes     to anon, authenticated;
grant update (status, moderated_at, moderator_note) on public.quotes to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on function public.public_stats() to anon, authenticated;
