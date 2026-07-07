create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  trust_score numeric not null default 1.0,
  review_count int not null default 0,
  five_star_ratio numeric not null default 0,
  average_score_given numeric not null default 0,
  average_review_length numeric not null default 0,
  report_count int not null default 0,
  hidden_review_count int not null default 0,
  is_admin boolean not null default false,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  region text not null,
  address text,
  lat double precision,
  lng double precision,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  ranking_limited boolean not null default false,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  taste_score int not null check (taste_score between 1 and 5),
  service_score int not null check (service_score between 1 and 5),
  environment_score int not null check (environment_score between 1 and 5),
  review_score numeric,
  review_text text,
  photo_url text,
  visit_type text,
  price_satisfaction text,
  is_high_score boolean not null default false,
  high_score_reason text,
  quality_weight numeric not null default 1.0,
  user_weight numeric not null default 1.0,
  final_weight numeric not null default 1.0,
  is_hidden boolean not null default false,
  excluded_from_score boolean not null default false,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.penalty_logs (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  severity int not null default 1,
  action text not null,
  admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.store_score_cache (
  store_id uuid primary key references public.stores(id) on delete cascade,
  raw_score numeric not null default 0,
  bayesian_raw_score numeric not null default 0,
  adjusted_score numeric not null default 3,
  ranking_score numeric not null default 3,
  taste_score numeric not null default 0,
  service_score numeric not null default 0,
  environment_score numeric not null default 0,
  review_count int not null default 0,
  revisit_rate numeric,
  unique_reviewer_count int not null default 0,
  returning_reviewer_count int not null default 0,
  trust_level text not null default 'unknown',
  peer_average_raw_score numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.scoring_settings (
  id boolean primary key default true check (id),
  include_synthetic_reviews boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.scoring_settings (id, include_synthetic_reviews)
values (true, false)
on conflict (id) do nothing;

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  target_type text not null,
  target_id uuid not null,
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists stores_region_category_idx on public.stores (region, category);
create index if not exists stores_category_idx on public.stores (category);
create index if not exists stores_synthetic_idx
  on public.stores (is_synthetic)
  where is_synthetic = true;
create index if not exists profiles_synthetic_idx
  on public.profiles (is_synthetic)
  where is_synthetic = true;
create index if not exists reviews_store_created_idx on public.reviews (store_id, created_at desc);
create index if not exists reviews_user_created_idx on public.reviews (user_id, created_at desc);
create index if not exists reviews_synthetic_idx
  on public.reviews (store_id, is_synthetic)
  where is_synthetic = true;
create index if not exists reviews_visible_score_idx
  on public.reviews (store_id)
  where is_hidden = false and excluded_from_score = false;
create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists reports_target_idx on public.reports (target_type, target_id);
create index if not exists store_score_cache_ranking_idx
  on public.store_score_cache (ranking_score desc)
  where review_count >= 5;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.calculate_review_score(
  taste int,
  service int,
  environment int
)
returns numeric
language sql
immutable
as $$
  select round(((taste * 0.5) + (service * 0.25) + (environment * 0.25))::numeric, 4);
$$;

create or replace function public.calculate_quality_weight(
  review_text text,
  photo_url text,
  is_high_score boolean,
  high_score_reason text
)
returns numeric
language plpgsql
immutable
as $$
declare
  review_length int := char_length(coalesce(trim(review_text), ''));
  weight numeric;
begin
  if review_length < 10 then
    weight := 0.6;
  elsif review_length < 30 then
    weight := 0.8;
  else
    weight := 1.0;
  end if;

  if char_length(coalesce(trim(photo_url), '')) > 0 then
    weight := weight + 0.1;
  end if;

  if coalesce(is_high_score, false)
    and char_length(coalesce(trim(high_score_reason), '')) >= 10 then
    weight := weight + 0.1;
  end if;

  return round(least(1.2, greatest(0.6, weight)), 4);
end;
$$;

create or replace function public.calculate_user_trust_weight(input_user_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
  weight numeric := 1.0;
begin
  select * into p from public.profiles where id = input_user_id;

  if not found then
    return 1.0;
  end if;

  if p.review_count >= 5 then
    weight := weight + 0.05;
  end if;

  if p.review_count >= 20 then
    weight := weight + 0.10;
  end if;

  if p.average_review_length >= 30 then
    weight := weight + 0.05;
  end if;

  if p.five_star_ratio >= 0.9 and p.review_count > 0 then
    weight := weight - 0.10;
  end if;

  if p.report_count >= 3 then
    weight := weight - 0.20;
  end if;

  if p.hidden_review_count >= 1 then
    weight := weight - 0.20;
  end if;

  return round(least(1.3, greatest(0.7, weight)), 4);
end;
$$;

create or replace function public.recalculate_profile_stats(input_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  visible_review_count int;
  high_score_count int;
  avg_score numeric;
  avg_length numeric;
  user_report_count int;
  user_hidden_count int;
begin
  perform set_config('app.bypass_profile_protection', 'on', true);

  select
    count(*)::int,
    count(*) filter (where coalesce(review_score, 0) >= 4.5)::int,
    coalesce(avg(review_score), 0),
    coalesce(avg(char_length(coalesce(review_text, ''))), 0)
  into visible_review_count, high_score_count, avg_score, avg_length
  from public.reviews
  where user_id = input_user_id
    and is_hidden = false;

  select count(*)::int
  into user_hidden_count
  from public.reviews
  where user_id = input_user_id
    and is_hidden = true;

  select count(*)::int
  into user_report_count
  from public.reports r
  where
    (r.target_type = 'profile' and r.target_id = input_user_id)
    or (
      r.target_type = 'review'
      and exists (
        select 1 from public.reviews rv
        where rv.id = r.target_id and rv.user_id = input_user_id
      )
    );

  update public.profiles
  set
    review_count = visible_review_count,
    five_star_ratio = case
      when visible_review_count = 0 then 0
      else round(high_score_count::numeric / visible_review_count::numeric, 4)
    end,
    average_score_given = round(avg_score, 4),
    average_review_length = round(avg_length, 4),
    report_count = user_report_count,
    hidden_review_count = user_hidden_count,
    updated_at = now()
  where id = input_user_id;

  update public.profiles
  set
    trust_score = public.calculate_user_trust_weight(input_user_id),
    updated_at = now()
  where id = input_user_id;

  perform set_config('app.bypass_review_maintenance', 'on', true);

  update public.reviews
  set
    user_weight = public.calculate_user_trust_weight(input_user_id),
    final_weight = round(quality_weight * public.calculate_user_trust_weight(input_user_id), 4)
  where user_id = input_user_id;
end;
$$;

create or replace function public.include_synthetic_reviews_in_scoring()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select include_synthetic_reviews from public.scoring_settings where id = true),
    false
  );
$$;

create or replace function public.get_peer_average(
  input_region text,
  input_category text
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  peer_average numeric;
  peer_review_count int;
begin
  select
    round(sum(store_raw_score * review_count) / nullif(sum(review_count), 0), 4),
    coalesce(sum(review_count), 0)::int
  into peer_average, peer_review_count
  from (
    select
      s.id,
      count(r.id)::int as review_count,
      sum(r.review_score * r.quality_weight * public.calculate_user_trust_weight(r.user_id))
        / nullif(sum(r.quality_weight * public.calculate_user_trust_weight(r.user_id)), 0)
        as store_raw_score
    from public.stores s
    join public.reviews r on r.store_id = s.id
    where s.region = input_region
      and s.category = input_category
      and r.is_hidden = false
      and r.excluded_from_score = false
      and (public.include_synthetic_reviews_in_scoring() or r.is_synthetic = false)
    group by s.id
  ) scoped;

  if peer_review_count >= 30 and peer_average is not null then
    return peer_average;
  end if;

  select
    round(sum(store_raw_score * review_count) / nullif(sum(review_count), 0), 4),
    coalesce(sum(review_count), 0)::int
  into peer_average, peer_review_count
  from (
    select
      s.id,
      count(r.id)::int as review_count,
      sum(r.review_score * r.quality_weight * public.calculate_user_trust_weight(r.user_id))
        / nullif(sum(r.quality_weight * public.calculate_user_trust_weight(r.user_id)), 0)
        as store_raw_score
    from public.stores s
    join public.reviews r on r.store_id = s.id
    where s.category = input_category
      and r.is_hidden = false
      and r.excluded_from_score = false
      and (public.include_synthetic_reviews_in_scoring() or r.is_synthetic = false)
    group by s.id
  ) scoped;

  if peer_review_count >= 30 and peer_average is not null then
    return peer_average;
  end if;

  select
    round(sum(store_raw_score * review_count) / nullif(sum(review_count), 0), 4),
    coalesce(sum(review_count), 0)::int
  into peer_average, peer_review_count
  from (
    select
      s.id,
      count(r.id)::int as review_count,
      sum(r.review_score * r.quality_weight * public.calculate_user_trust_weight(r.user_id))
        / nullif(sum(r.quality_weight * public.calculate_user_trust_weight(r.user_id)), 0)
        as store_raw_score
    from public.stores s
    join public.reviews r on r.store_id = s.id
    where r.is_hidden = false
      and r.excluded_from_score = false
      and (public.include_synthetic_reviews_in_scoring() or r.is_synthetic = false)
    group by s.id
  ) scoped;

  if peer_review_count >= 30 and peer_average is not null then
    return peer_average;
  end if;

  return coalesce(peer_average, 3.0);
end;
$$;

create or replace function public.refresh_store_score_cache(input_store_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_store public.stores%rowtype;
  visible_review_count int := 0;
  raw numeric := 0;
  bayesian_raw numeric := 3;
  adjusted numeric := 3;
  ranking numeric := 0;
  taste_avg numeric := 0;
  service_avg numeric := 0;
  environment_avg numeric := 0;
  revisit_rate numeric := null;
  unique_reviewer_count int := 0;
  returning_reviewer_count int := 0;
  peer_avg numeric := 3;
  avg_user_weight numeric := 1;
  revisit_score numeric := 0;
  trust_score numeric := 3;
  trust_label text := 'unknown';
begin
  select * into target_store from public.stores where id = input_store_id;

  if not found then
    return;
  end if;

  select
    count(*)::int,
    coalesce(sum(review_score * final_weight_calc) / nullif(sum(final_weight_calc), 0), 0),
    coalesce(sum(taste_score * final_weight_calc) / nullif(sum(final_weight_calc), 0), 0),
    coalesce(sum(service_score * final_weight_calc) / nullif(sum(final_weight_calc), 0), 0),
    coalesce(sum(environment_score * final_weight_calc) / nullif(sum(final_weight_calc), 0), 0),
    coalesce(avg(user_weight_calc), 1)
  into
    visible_review_count,
    raw,
    taste_avg,
    service_avg,
    environment_avg,
    avg_user_weight
  from (
    select
      r.*,
      public.calculate_user_trust_weight(r.user_id) as user_weight_calc,
      r.quality_weight * public.calculate_user_trust_weight(r.user_id) as final_weight_calc
    from public.reviews r
    where r.store_id = input_store_id
      and r.is_hidden = false
      and r.excluded_from_score = false
      and (public.include_synthetic_reviews_in_scoring() or r.is_synthetic = false)
      and r.review_score is not null
  ) weighted_reviews;

  select
    count(*)::int,
    coalesce(
      count(*) filter (
        where valid_review_count >= 2
          and last_review_at - first_review_at >= interval '24 hours'
      ),
      0
    )::int
  into unique_reviewer_count, returning_reviewer_count
  from (
    select
      r.user_id,
      count(*)::int as valid_review_count,
      min(r.created_at) as first_review_at,
      max(r.created_at) as last_review_at
    from public.reviews r
    where r.store_id = input_store_id
      and r.is_hidden = false
      and r.excluded_from_score = false
      and (public.include_synthetic_reviews_in_scoring() or r.is_synthetic = false)
    group by r.user_id
  ) reviewer_stats;

  if unique_reviewer_count >= 3 then
    revisit_rate := returning_reviewer_count::numeric / nullif(unique_reviewer_count, 0);
  else
    revisit_rate := null;
  end if;

  peer_avg := public.get_peer_average(target_store.region, target_store.category);
  bayesian_raw := ((visible_review_count * raw) + (20 * peer_avg)) / (visible_review_count + 20);
  adjusted := least(5.0, greatest(1.0, 3 + (0.8 * (bayesian_raw - peer_avg))));
  revisit_score := least(5.0, greatest(0.0, coalesce(revisit_rate, 0) * 5));
  trust_score := least(5.0, greatest(1.0, 1 + (4 * ((avg_user_weight - 0.7) / 0.6))));

  if visible_review_count = 0 then
    trust_label := 'unknown';
  elsif avg_user_weight >= 1.1 then
    trust_label := 'high';
  elsif avg_user_weight >= 0.95 then
    trust_label := 'medium';
  else
    trust_label := 'low';
  end if;

  ranking := (adjusted * 0.75) + (revisit_score * 0.10) + (trust_score * 0.15);

  if visible_review_count < 5 or target_store.ranking_limited then
    ranking := 0;
  end if;

  insert into public.store_score_cache (
    store_id,
    raw_score,
    bayesian_raw_score,
    adjusted_score,
    ranking_score,
    taste_score,
    service_score,
    environment_score,
    review_count,
    revisit_rate,
    unique_reviewer_count,
    returning_reviewer_count,
    trust_level,
    peer_average_raw_score,
    updated_at
  )
  values (
    input_store_id,
    round(raw, 4),
    round(bayesian_raw, 4),
    round(adjusted, 4),
    round(ranking, 4),
    round(taste_avg, 4),
    round(service_avg, 4),
    round(environment_avg, 4),
    visible_review_count,
    case when revisit_rate is null then null else round(revisit_rate, 4) end,
    unique_reviewer_count,
    returning_reviewer_count,
    trust_label,
    round(peer_avg, 4),
    now()
  )
  on conflict (store_id) do update
  set
    raw_score = excluded.raw_score,
    bayesian_raw_score = excluded.bayesian_raw_score,
    adjusted_score = excluded.adjusted_score,
    ranking_score = excluded.ranking_score,
    taste_score = excluded.taste_score,
    service_score = excluded.service_score,
    environment_score = excluded.environment_score,
    review_count = excluded.review_count,
    revisit_rate = excluded.revisit_rate,
    unique_reviewer_count = excluded.unique_reviewer_count,
    returning_reviewer_count = excluded.returning_reviewer_count,
    trust_level = excluded.trust_level,
    peer_average_raw_score = excluded.peer_average_raw_score,
    updated_at = now();
end;
$$;

create or replace function public.refresh_all_store_scores()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  store_record record;
begin
  for store_record in select id from public.stores loop
    perform public.refresh_store_score_cache(store_record.id);
  end loop;
end;
$$;

create or replace function public.set_synthetic_reviews_included(include_reviews boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.scoring_settings (id, include_synthetic_reviews, updated_at)
  values (true, include_reviews, now())
  on conflict (id) do update
  set
    include_synthetic_reviews = excluded.include_synthetic_reviews,
    updated_at = now();

  perform public.refresh_all_store_scores();
end;
$$;

revoke all on function public.set_synthetic_reviews_included(boolean) from public, anon, authenticated;

create or replace function public.set_synthetic_reviews_excluded(exclude_reviews boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.set_synthetic_reviews_included(not exclude_reviews);
end;
$$;

revoke all on function public.set_synthetic_reviews_excluded(boolean) from public, anon, authenticated;

create or replace function public.create_report(
  input_target_type text,
  input_target_id uuid,
  input_reporter_id uuid,
  input_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_report_id uuid;
  affected_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required to create a report.';
  end if;

  if input_reporter_id <> auth.uid() and not public.current_user_is_admin() then
    raise exception 'Reporter id must match the authenticated user.';
  end if;

  insert into public.reports (target_type, target_id, reporter_id, reason)
  values (input_target_type, input_target_id, input_reporter_id, input_reason)
  returning id into new_report_id;

  if input_target_type = 'review' then
    select user_id into affected_user_id
    from public.reviews
    where id = input_target_id;

    if affected_user_id is not null then
      perform public.recalculate_profile_stats(affected_user_id);
    end if;
  elsif input_target_type = 'profile' then
    perform public.recalculate_profile_stats(input_target_id);
  end if;

  return new_report_id;
end;
$$;

create or replace function public.prepare_review_scoring()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.review_score := public.calculate_review_score(
    new.taste_score,
    new.service_score,
    new.environment_score
  );
  new.is_high_score := new.review_score >= 4.5;
  new.quality_weight := public.calculate_quality_weight(
    new.review_text,
    new.photo_url,
    new.is_high_score,
    new.high_score_reason
  );
  new.user_weight := public.calculate_user_trust_weight(new.user_id);
  new.final_weight := round(new.quality_weight * new.user_weight, 4);
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('app.bypass_profile_protection', true) = 'on' then
    return new;
  end if;

  if public.current_user_is_admin() then
    return new;
  end if;

  if auth.uid() is null or auth.uid() <> old.id then
    raise exception 'Profile updates are limited to the profile owner.';
  end if;

  new.trust_score := old.trust_score;
  new.review_count := old.review_count;
  new.five_star_ratio := old.five_star_ratio;
  new.average_score_given := old.average_score_given;
  new.average_review_length := old.average_review_length;
  new.report_count := old.report_count;
  new.hidden_review_count := old.hidden_review_count;
  new.is_admin := old.is_admin;
  new.is_synthetic := old.is_synthetic;
  return new;
end;
$$;

create or replace function public.prevent_review_moderation_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('app.bypass_review_maintenance', true) = 'on' then
    return new;
  end if;

  if public.current_user_is_admin() then
    return new;
  end if;

  if auth.uid() is null or auth.uid() <> old.user_id then
    raise exception 'Review updates are limited to the review owner.';
  end if;

  new.user_id := old.user_id;
  new.store_id := old.store_id;
  new.is_hidden := old.is_hidden;
  new.excluded_from_score := old.excluded_from_score;
  new.is_synthetic := old.is_synthetic;
  return new;
end;
$$;

create or replace function public.after_review_change_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.bypass_review_maintenance', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.recalculate_profile_stats(old.user_id);
    perform public.refresh_store_score_cache(old.store_id);
    return old;
  end if;

  if tg_op = 'UPDATE' then
    perform public.recalculate_profile_stats(old.user_id);
    if old.user_id <> new.user_id then
      perform public.recalculate_profile_stats(new.user_id);
    end if;
    perform public.refresh_store_score_cache(old.store_id);
    if old.store_id <> new.store_id then
      perform public.refresh_store_score_cache(new.store_id);
    end if;
    return new;
  end if;

  perform public.recalculate_profile_stats(new.user_id);
  perform public.refresh_store_score_cache(new.store_id);
  return new;
end;
$$;

create or replace function public.after_report_change_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_user_id uuid;
  target_type text;
  target_id uuid;
begin
  if tg_op = 'DELETE' then
    target_type := old.target_type;
    target_id := old.target_id;
  else
    target_type := new.target_type;
    target_id := new.target_id;
  end if;

  if target_type = 'review' then
    select user_id into affected_user_id
    from public.reviews
    where id = target_id;

    if affected_user_id is not null then
      perform public.recalculate_profile_stats(affected_user_id);
    end if;
  elsif target_type = 'profile' then
    perform public.recalculate_profile_stats(target_id);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists reviews_prepare_scoring on public.reviews;
create trigger reviews_prepare_scoring
before insert or update on public.reviews
for each row execute function public.prepare_review_scoring();

drop trigger if exists profiles_protect_stats on public.profiles;
create trigger profiles_protect_stats
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop trigger if exists reviews_protect_moderation on public.reviews;
create trigger reviews_protect_moderation
before update on public.reviews
for each row execute function public.prevent_review_moderation_escalation();

drop trigger if exists reviews_after_change_refresh on public.reviews;
create trigger reviews_after_change_refresh
after insert or update or delete on public.reviews
for each row execute function public.after_review_change_refresh();

drop trigger if exists reports_after_change_refresh on public.reports;
create trigger reports_after_change_refresh
after insert or update or delete on public.reports
for each row execute function public.after_report_change_refresh();

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.penalty_logs enable row level security;
alter table public.store_score_cache enable row level security;
alter table public.scoring_settings enable row level security;
alter table public.admin_actions enable row level security;

drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read"
on public.profiles for select
using (true);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles admin all"
on public.profiles for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "stores public read" on public.stores;
create policy "stores public read"
on public.stores for select
using (true);

drop policy if exists "stores admin all" on public.stores;
create policy "stores admin all"
on public.stores for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "reviews public read visible" on public.reviews;
create policy "reviews public read visible"
on public.reviews for select
using (is_hidden = false);

drop policy if exists "reviews insert self" on public.reviews;
create policy "reviews insert self"
on public.reviews for insert
to authenticated
with check (
  user_id = auth.uid()
  and is_hidden = false
  and excluded_from_score = false
);

drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own"
on public.reviews for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "reviews delete own" on public.reviews;
create policy "reviews delete own"
on public.reviews for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "reviews admin all" on public.reviews;
create policy "reviews admin all"
on public.reviews for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "reports select own or admin" on public.reports;
create policy "reports select own or admin"
on public.reports for select
to authenticated
using (reporter_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "reports insert self" on public.reports;
create policy "reports insert self"
on public.reports for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "reports admin update" on public.reports;
create policy "reports admin update"
on public.reports for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "penalty logs admin all" on public.penalty_logs;
create policy "penalty logs admin all"
on public.penalty_logs for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "store score cache public read" on public.store_score_cache;
create policy "store score cache public read"
on public.store_score_cache for select
using (true);

drop policy if exists "scoring settings admin read" on public.scoring_settings;
create policy "scoring settings admin read"
on public.scoring_settings for select
to authenticated
using (public.current_user_is_admin());

drop policy if exists "scoring settings admin update" on public.scoring_settings;
create policy "scoring settings admin update"
on public.scoring_settings for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "admin actions admin all" on public.admin_actions;
create policy "admin actions admin all"
on public.admin_actions for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-photos',
  'review-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "review photos public read" on storage.objects;
create policy "review photos public read"
on storage.objects for select
using (bucket_id = 'review-photos');

drop policy if exists "review photos authenticated upload" on storage.objects;
create policy "review photos authenticated upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'review-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
