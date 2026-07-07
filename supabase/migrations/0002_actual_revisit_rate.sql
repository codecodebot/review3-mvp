alter table public.reviews
  drop column if exists revisit_intent;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'store_score_cache'
      and column_name = 'revisit_intent_rate'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'store_score_cache'
      and column_name = 'revisit_rate'
  ) then
    alter table public.store_score_cache
      rename column revisit_intent_rate to revisit_rate;
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'store_score_cache'
      and column_name = 'revisit_rate'
  ) then
    alter table public.store_score_cache
      add column revisit_rate numeric;
  end if;
end;
$$;

alter table public.store_score_cache
  alter column revisit_rate drop not null,
  alter column revisit_rate drop default;

alter table public.store_score_cache
  add column if not exists unique_reviewer_count int not null default 0,
  add column if not exists returning_reviewer_count int not null default 0;

drop function if exists public.calculate_quality_weight(text, text, boolean, text, text);

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

select public.refresh_all_store_scores();
