alter table public.reviews
  add column if not exists positive_text text,
  add column if not exists negative_text text,
  add column if not exists section_sentiment_mismatch boolean not null default false,
  add column if not exists section_mismatch_reason text,
  add column if not exists positive_text_sentiment_label text,
  add column if not exists negative_text_sentiment_label text,
  add column if not exists positive_text_sentiment_score numeric,
  add column if not exists negative_text_sentiment_score numeric,
  add column if not exists text_completeness_weight numeric not null default 1.0;

create index if not exists reviews_section_sentiment_mismatch_idx
  on public.reviews (store_id, section_sentiment_mismatch)
  where is_hidden = false;

comment on column public.reviews.positive_text is
  'Structured review section for what the reviewer liked.';

comment on column public.reviews.negative_text is
  'Structured review section for what the reviewer found lacking.';

comment on column public.reviews.section_sentiment_mismatch is
  'Neutral trust signal for cases where a structured review section sentiment conflicts with the expected section direction.';

comment on column public.reviews.text_completeness_weight is
  'Small scoring weight multiplier for complete structured review sections. Mismatch reviews do not receive this bonus.';

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
  new.text_completeness_weight := least(1.06, greatest(1.0, coalesce(new.text_completeness_weight, 1.0)));
  if coalesce(new.section_sentiment_mismatch, false) then
    new.text_completeness_weight := 1.0;
  end if;
  new.final_weight := round(new.quality_weight * new.user_weight * new.text_completeness_weight, 4);
  new.updated_at := now();
  return new;
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
  taste_avg numeric := 0;
  service_avg numeric := 0;
  environment_avg numeric := 0;
  revisit_rate numeric := null;
  unique_reviewer_count int := 0;
  returning_reviewer_count int := 0;
  avg_user_weight numeric := 1;
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
      r.quality_weight
        * public.calculate_user_trust_weight(r.user_id)
        * case when coalesce(r.purchase_verified, true) then 1.0 else 0.55 end
        * least(1.06, greatest(1.0, coalesce(r.text_completeness_weight, 1.0)))
        as final_weight_calc
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

  if visible_review_count = 0 then
    trust_label := 'unknown';
  elsif avg_user_weight >= 1.1 then
    trust_label := 'high';
  elsif avg_user_weight >= 0.95 then
    trust_label := 'medium';
  else
    trust_label := 'low';
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
    round(raw, 4),
    3,
    case when visible_review_count >= 5 and target_store.ranking_limited = false then 3 else 0 end,
    round(taste_avg, 4),
    round(service_avg, 4),
    round(environment_avg, 4),
    visible_review_count,
    case when revisit_rate is null then null else round(revisit_rate, 4) end,
    unique_reviewer_count,
    returning_reviewer_count,
    trust_label,
    3,
    now()
  )
  on conflict (store_id) do update
  set
    raw_score = excluded.raw_score,
    bayesian_raw_score = excluded.bayesian_raw_score,
    taste_score = excluded.taste_score,
    service_score = excluded.service_score,
    environment_score = excluded.environment_score,
    review_count = excluded.review_count,
    revisit_rate = excluded.revisit_rate,
    unique_reviewer_count = excluded.unique_reviewer_count,
    returning_reviewer_count = excluded.returning_reviewer_count,
    trust_level = excluded.trust_level,
    updated_at = now();

  perform public.refresh_store_score_normalization();
end;
$$;

select public.refresh_all_store_scores();
