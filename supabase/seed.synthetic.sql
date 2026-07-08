-- ============================================================================
-- DANGER: DEVELOPMENT/DEMO ONLY.
-- DO NOT RUN THIS FILE IN PRODUCTION OR AGAINST REAL CUSTOMER DATA.
--
-- This script creates deterministic medium-scale synthetic data for local/dev:
--   - 1,000 synthetic stores
--   - 1,000 synthetic auth users/profiles
--   - 50,000+ synthetic reviews
--
-- It deletes and recreates rows explicitly marked is_synthetic = true, then
-- enables synthetic reviews for scoring. It is intentionally scoped to demo
-- users and synthetic rows only.
-- ============================================================================

begin;

select set_config('app.bypass_profile_protection', 'on', true);
select set_config('app.bypass_review_maintenance', 'on', true);

delete from public.reviews
where is_synthetic = true;

delete from public.profiles
where is_synthetic = true;

delete from auth.users
where email like 'demo.user.%@example.test';

delete from public.stores s
where s.is_synthetic = true
  and not exists (
    select 1
    from public.reviews r
    where r.store_id = s.id
      and r.is_synthetic = false
  );

with generated_stores as (
  select
    store_no,
    case
      when store_no <= 10 then ('aaaaaaaa-aaaa-aaaa-aaaa-' || lpad(store_no::text, 12, 'a'))::uuid
      else ('aaaaaaaa-aaaa-aaaa-bbbb-' || lpad(store_no::text, 12, '0'))::uuid
    end as id,
    (array[
      'Cafe',
      'Korean',
      'Japanese',
      'Western',
      'Bakery',
      'Dessert',
      'Chinese'
    ])[((store_no - 1) % 7) + 1] as category,
    (array[
      'Seoul Mapo',
      'Seoul Gangnam',
      'Seoul Jongno',
      'Busan Haeundae',
      'Incheon Songdo',
      'Seoul Seongsu',
      'Busan Jeonpo',
      'Daegu Dongseongro'
    ])[((store_no - 1) % 8) + 1] as region,
    (array[
      'Maple',
      'Quiet',
      'Copper',
      'Cloud',
      'Harbor',
      'Fig',
      'Jasmine',
      'Stone',
      'River',
      'Market',
      'Archive',
      'Locale',
      'North',
      'Signal',
      'Table'
    ])[((store_no - 1) % 15) + 1] as name_prefix
  from generate_series(1, 1000) as series(store_no)
)
insert into public.stores (
  id,
  name,
  category,
  region,
  address,
  verification_status,
  is_synthetic
)
select
  id,
  name_prefix || ' ' || category || ' ' || lpad(store_no::text, 4, '0'),
  category,
  region,
  store_no || ' Demo-gil',
  case when store_no % 10 in (0, 1, 3, 6, 8) then 'verified' else 'pending' end,
  true
from generated_stores
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  region = excluded.region,
  address = excluded.address,
  verification_status = excluded.verification_status,
  is_synthetic = true,
  updated_at = now();

with synthetic_users as (
  select
    user_no,
    ('90000000-0000-0000-0000-' || lpad(user_no::text, 12, '0'))::uuid as id,
    'demo.user.' || lpad(user_no::text, 4, '0') || '@example.test' as email,
    'Demo User ' || lpad(user_no::text, 4, '0') as nickname
  from generate_series(1, 1000) as series(user_no)
)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  email,
  crypt('demo-password-123', gen_salt('bf')),
  timestamp with time zone '2026-01-01 00:00:00+00',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('nickname', nickname, 'is_synthetic', true),
  timestamp with time zone '2026-01-01 00:00:00+00' + (user_no * interval '10 minutes'),
  timestamp with time zone '2026-01-01 00:00:00+00' + (user_no * interval '10 minutes')
from synthetic_users
on conflict (id) do update
set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

with synthetic_users as (
  select
    user_no,
    ('90000000-0000-0000-0000-' || lpad(user_no::text, 12, '0'))::uuid as id,
    'Demo User ' || lpad(user_no::text, 4, '0') as nickname
  from generate_series(1, 1000) as series(user_no)
)
insert into public.profiles (id, nickname, is_synthetic, created_at, updated_at)
select
  id,
  nickname,
  true,
  timestamp with time zone '2026-01-01 00:00:00+00' + (user_no * interval '10 minutes'),
  timestamp with time zone '2026-01-01 00:00:00+00' + (user_no * interval '10 minutes')
from synthetic_users
on conflict (id) do update
set
  nickname = excluded.nickname,
  is_synthetic = true,
  updated_at = excluded.updated_at;

with
store_profiles as (
  select
    row_number() over (order by s.id) as store_no,
    s.id as store_id,
    s.name as store_name,
    s.category,
    case
      when row_number() over (order by s.id) % 100 = 0 then 260
      when row_number() over (order by s.id) % 50 = 0 then 180
      when row_number() over (order by s.id) % 20 in (1, 2) then 120
      when row_number() over (order by s.id) % 10 in (3, 4) then 75
      when row_number() over (order by s.id) % 5 = 0 then 45
      else 18 + ((row_number() over (order by s.id) * 37) % 25)
    end as target_reviews,
    case
      when row_number() over (order by s.id) % 100 in (1, 2, 3, 4, 5) then 4.88::numeric
      when row_number() over (order by s.id) % 100 between 6 and 35 then 4.62::numeric
      when row_number() over (order by s.id) % 100 between 36 and 78 then 4.32::numeric
      when row_number() over (order by s.id) % 100 between 79 and 92 then 3.75::numeric
      when row_number() over (order by s.id) % 100 between 93 and 98 then 3.15::numeric
      else 2.65::numeric
    end + ((((row_number() over (order by s.id) * 17) % 9) - 4)::numeric * 0.04) as quality_anchor,
    case
      when row_number() over (order by s.id) % 10 in (1, 2) then 0.34::numeric
      when row_number() over (order by s.id) % 10 in (3, 4, 5) then 0.22::numeric
      when row_number() over (order by s.id) % 10 in (6, 7) then 0.12::numeric
      else 0.06::numeric
    end as repeat_ratio
  from public.stores s
  where s.is_synthetic = true
),
review_slots as (
  select
    sp.*,
    greatest(2, floor(sp.target_reviews * sp.repeat_ratio / 2)::int) as repeat_pair_count,
    slot.review_index
  from store_profiles sp
  join lateral generate_series(1, sp.target_reviews) as slot(review_index) on true
),
review_inputs as (
  select
    row_number() over (order by store_no, review_index) as review_no,
    store_no,
    store_id,
    store_name,
    category,
    quality_anchor,
    target_reviews,
    repeat_pair_count,
    review_index,
    case
      when review_index <= repeat_pair_count * 2 then
        1 + ((store_no * 47 + (((review_index - 1) / 2)::int * 13)) % 1000)
      when store_no % 10 = 0 then
        831 + ((store_no * 7 + review_index * 17) % 100)
      when store_no % 10 = 1 then
        931 + ((store_no * 11 + review_index * 19) % 70)
      when store_no % 10 = 2 then
        551 + ((store_no * 13 + review_index * 23) % 150)
      when store_no % 10 = 3 then
        701 + ((store_no * 17 + review_index * 29) % 130)
      else
        1 + ((store_no * 97 + review_index * 31) % 1000)
    end as user_no,
    case
      when review_index <= repeat_pair_count * 2 and review_index % 2 = 0 then 2
      else 1
    end as visit_number
  from review_slots
),
review_personas as (
  select
    ri.*,
    ('90000000-0000-0000-0000-' || lpad(ri.user_no::text, 12, '0'))::uuid as user_id,
    case
      when ri.user_no between 1 and 520 then 'general'
      when ri.user_no between 521 and 710 then 'generous'
      when ri.user_no between 711 and 850 then 'critical'
      when ri.user_no between 851 and 930 then 'terse_low_quality'
      else 'explorer'
    end as persona
  from review_inputs ri
),
scored_reviews as (
  select
    *,
    store_no % 25 in (1, 2, 3) as is_rising_candidate,
    store_no % 25 in (1, 2, 3) and review_index > target_reviews - 10 as is_recent_momentum_review,
    case
      when store_no % 25 in (1, 2, 3) and review_index > target_reviews - 10 then 0.70::numeric
      when store_no % 25 in (1, 2, 3) then -0.18::numeric
      else 0::numeric
    end as momentum_bias,
    case persona
      when 'generous' then 0.28::numeric
      when 'critical' then -0.42::numeric
      when 'terse_low_quality' then -0.12::numeric
      when 'explorer' then 0.03::numeric
      else 0::numeric
    end as persona_bias,
    case
      when (store_no * 19 + review_index * 23 + user_no) % 100 < 8 then -1.15::numeric
      when (store_no * 19 + review_index * 23 + user_no) % 100 < 18 then -0.55::numeric
      when (store_no * 19 + review_index * 23 + user_no) % 100 < 74 then 0.18::numeric
      else 0.36::numeric
    end as inflation_bias,
    ((((store_no * 41 + review_index * 17 + user_no * 3) % 11) - 5)::numeric * 0.07) as taste_noise,
    ((((store_no * 31 + review_index * 13 + user_no * 5) % 11) - 5)::numeric * 0.07) as service_noise,
    ((((store_no * 23 + review_index * 19 + user_no * 7) % 11) - 5)::numeric * 0.07) as environment_noise
  from review_personas
),
dated_reviews as (
  select
    *,
    floor(
      365
      * power(
        (((store_no * 7919 + review_index * 1543 + user_no * 337) % 10000) + 1)::numeric / 10000,
        1.85
      )
    )::int as age_days
  from scored_reviews
),
final_reviews as (
  select
    *,
    least(5, greatest(1, round(quality_anchor + persona_bias + momentum_bias + inflation_bias + taste_noise + 0.08)::int)) as taste_score,
    least(5, greatest(1, round(quality_anchor + persona_bias + momentum_bias + inflation_bias + service_noise - 0.04)::int)) as service_score,
    least(5, greatest(1, round(quality_anchor + persona_bias + momentum_bias + inflation_bias + environment_noise)::int)) as environment_score,
    case
      when is_recent_momentum_review then
        now() - ((review_index % 28) * interval '1 day') - (store_no * interval '3 minutes')
      else
        now()
          - (age_days * interval '1 day')
          - ((store_no * 17 + review_index * 11) % 1440) * interval '1 minute'
          + case when visit_number = 2 then interval '2 days' else interval '0 days' end
    end as created_at,
    (store_no * review_index + user_no) % 6 <> 0 as purchase_verified
  from dated_reviews
),
review_scored_payload as (
  select
    *,
    (taste_score * 0.5 + service_score * 0.25 + environment_score * 0.25) as computed_review_score
  from final_reviews
),
review_payload as (
  select
    *,
    case
      when taste_score >= 5 and service_score >= 4 then '맛이 또렷하고 직원 응대도 안정적이었습니다.'
      when taste_score >= 4 then '대표 메뉴의 맛이 좋고 전반적으로 만족스러웠습니다.'
      when service_score >= 5 then '서비스가 빠르고 친절해서 방문 경험이 좋아졌습니다.'
      when environment_score >= 5 then '공간이 정돈되어 있고 머무르기 편했습니다.'
      else '기본적인 방문 경험은 무난했습니다.'
    end as positive_text,
    case
      when computed_review_score >= 4.75 and (review_no + store_no) % 7 <> 0 then '큰 아쉬움은 없었지만 피크 시간에는 조금 붐빌 수 있습니다.'
      when service_score <= 3 then '주문 대기와 안내가 조금 느리게 느껴졌습니다.'
      when taste_score <= 3 then '일부 메뉴는 기대보다 맛의 선명도가 낮았습니다.'
      when environment_score <= 3 then '좌석 간격이나 소음은 조금 아쉬웠습니다.'
      when (review_no + user_no) % 9 = 0 then '가격 대비 만족도는 사람에 따라 다를 수 있습니다.'
      else null
    end as negative_text
  from review_scored_payload
)
insert into public.reviews (
  id,
  store_id,
  user_id,
  taste_score,
  service_score,
  environment_score,
  review_text,
  positive_text,
  negative_text,
  photo_url,
  visit_type,
  price_satisfaction,
  high_score_reason,
  purchase_verified,
  section_sentiment_mismatch,
  section_mismatch_reason,
  positive_text_sentiment_label,
  negative_text_sentiment_label,
  positive_text_sentiment_score,
  negative_text_sentiment_score,
  text_completeness_weight,
  is_hidden,
  excluded_from_score,
  is_synthetic,
  created_at,
  updated_at
)
select
  ('91000000-0000-0000-0000-' || lpad(review_no::text, 12, '0'))::uuid,
  store_id,
  user_id,
  taste_score,
  service_score,
  environment_score,
  concat_ws(E'\n\n', '좋았던 점' || E'\n' || positive_text, case when negative_text is not null then '아쉬웠던 점' || E'\n' || negative_text end),
  positive_text,
  negative_text,
  case
    when (store_no * review_index + user_no) % 4 = 0 then
      'https://example.com/demo/store-' || store_no || '-review-' || review_no || '.jpg'
    else null
  end,
  case (user_no + review_index) % 5
    when 0 then 'solo'
    when 1 then 'friends'
    when 2 then 'date'
    when 3 then 'family'
    else 'business'
  end,
  case
    when computed_review_score >= 4.5 then 'good'
    when computed_review_score >= 3.5 then 'fair'
    else 'poor'
  end,
  case
    when computed_review_score >= 4.5 and (review_no + user_no) % 4 <> 0 then
      '높은 점수는 맛, 서비스, 분위기 중 하나 이상의 뚜렷한 강점으로 설명됩니다.'
    else null
  end,
  purchase_verified,
  false,
  null,
  case when positive_text is null then null else 'positive' end,
  case when negative_text is null then null else 'negative' end,
  case when positive_text is null then null else 0.72 end,
  case when negative_text is null then null else -0.58 end,
  case
    when positive_text is not null and negative_text is not null then 1.06
    when positive_text is not null or negative_text is not null then 1.03
    else 1.0
  end,
  (store_no * review_index + user_no) % 211 = 0,
  (store_no + review_index + user_no) % 257 = 0,
  true,
  created_at,
  created_at
from review_payload
on conflict (id) do update
set
  store_id = excluded.store_id,
  user_id = excluded.user_id,
  taste_score = excluded.taste_score,
  service_score = excluded.service_score,
  environment_score = excluded.environment_score,
  review_text = excluded.review_text,
  positive_text = excluded.positive_text,
  negative_text = excluded.negative_text,
  photo_url = excluded.photo_url,
  visit_type = excluded.visit_type,
  price_satisfaction = excluded.price_satisfaction,
  high_score_reason = excluded.high_score_reason,
  purchase_verified = excluded.purchase_verified,
  section_sentiment_mismatch = excluded.section_sentiment_mismatch,
  section_mismatch_reason = excluded.section_mismatch_reason,
  positive_text_sentiment_label = excluded.positive_text_sentiment_label,
  negative_text_sentiment_label = excluded.negative_text_sentiment_label,
  positive_text_sentiment_score = excluded.positive_text_sentiment_score,
  negative_text_sentiment_score = excluded.negative_text_sentiment_score,
  text_completeness_weight = excluded.text_completeness_weight,
  is_hidden = excluded.is_hidden,
  excluded_from_score = excluded.excluded_from_score,
  is_synthetic = true,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

with profile_stats as (
  select
    p.id,
    count(r.id)::int as review_count,
    coalesce(avg(r.review_score), 0) as average_score_given,
    coalesce(avg(char_length(coalesce(r.review_text, ''))), 0) as average_review_length,
    coalesce(
      count(*) filter (where r.review_score >= 4.75)::numeric / nullif(count(r.id), 0),
      0
    ) as five_star_ratio,
    count(*) filter (where r.is_hidden = true)::int as hidden_review_count
  from public.profiles p
  left join public.reviews r on r.user_id = p.id
  where p.is_synthetic = true
  group by p.id
)
update public.profiles p
set
  review_count = profile_stats.review_count,
  average_score_given = round(profile_stats.average_score_given, 4),
  average_review_length = round(profile_stats.average_review_length, 2),
  five_star_ratio = round(profile_stats.five_star_ratio, 4),
  hidden_review_count = profile_stats.hidden_review_count,
  updated_at = now()
from profile_stats
where p.id = profile_stats.id;

select public.set_synthetic_reviews_included(true);
select public.refresh_all_store_scores();

select
  (select count(*) from public.stores where is_synthetic = true) as synthetic_store_count,
  (select count(*) from public.reviews where is_synthetic = true) as synthetic_review_count,
  (select min(created_at)::date from public.reviews where is_synthetic = true) as oldest_synthetic_review_date,
  (select max(created_at)::date from public.reviews where is_synthetic = true) as newest_synthetic_review_date,
  (
    select count(*)
    from public.reviews
    where is_synthetic = true
      and review_score >= 4.5
  ) as high_raw_review_count;

commit;
