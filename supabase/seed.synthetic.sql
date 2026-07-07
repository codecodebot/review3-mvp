-- ============================================================================
-- DANGER: DEVELOPMENT/DEMO ONLY.
-- DO NOT RUN THIS FILE IN PRODUCTION OR AGAINST REAL CUSTOMER DATA.
--
-- This script creates 100 synthetic stores, 1000 demo auth users, and roughly
-- 6300 deterministic synthetic reviews. It deletes and recreates rows marked
-- as synthetic, then enables synthetic reviews for scoring through
-- public.scoring_settings.
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
      when store_no = 1 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid
      when store_no = 2 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid
      when store_no = 3 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid
      when store_no = 4 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid
      when store_no = 5 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'::uuid
      when store_no = 6 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'::uuid
      when store_no = 7 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7'::uuid
      when store_no = 8 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8'::uuid
      when store_no = 9 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9'::uuid
      when store_no = 10 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid
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
      'Market'
    ])[((store_no - 1) % 10) + 1] as name_prefix
  from generate_series(1, 100) as series(store_no)
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
  name_prefix || ' ' || category || ' ' || lpad(store_no::text, 3, '0'),
  category,
  region,
  store_no || ' Demo-gil',
  case when store_no % 5 in (0, 1, 3) then 'verified' else 'pending' end,
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
  timestamp with time zone '2026-03-01 00:00:00+00',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('nickname', nickname, 'is_synthetic', true),
  timestamp with time zone '2026-03-01 00:00:00+00' + (user_no * interval '10 minutes'),
  timestamp with time zone '2026-03-01 00:00:00+00' + (user_no * interval '10 minutes')
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
  timestamp with time zone '2026-03-01 00:00:00+00' + (user_no * interval '10 minutes'),
  timestamp with time zone '2026-03-01 00:00:00+00' + (user_no * interval '10 minutes')
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
      when row_number() over (order by s.id) % 13 in (1, 2) then 4.65::numeric
      when row_number() over (order by s.id) % 13 in (3, 4, 5) then 4.25::numeric
      when row_number() over (order by s.id) % 13 in (6, 7, 8, 9) then 3.75::numeric
      when row_number() over (order by s.id) % 13 in (10, 11) then 3.25::numeric
      else 2.85::numeric
    end + ((((row_number() over (order by s.id) * 17) % 9) - 4)::numeric * 0.05) as quality_anchor,
    18 + ((row_number() over (order by s.id) * 37) % 91) as target_reviews,
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
    greatest(1, floor(sp.target_reviews * sp.repeat_ratio / 2)::int) as repeat_pair_count,
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
      when ri.user_no between 1 and 550 then 'general'
      when ri.user_no between 551 and 700 then 'generous'
      when ri.user_no between 701 and 830 then 'critical'
      when ri.user_no between 831 and 930 then 'terse_low_quality'
      else 'explorer'
    end as persona
  from review_inputs ri
),
scored_reviews as (
  select
    *,
    store_no % 20 in (1, 2) as is_rising_candidate,
    store_no % 20 in (1, 2) and review_index > target_reviews - 8 as is_recent_momentum_review,
    case
      when store_no % 20 in (1, 2) and review_index > target_reviews - 8 then 0.85::numeric
      when store_no % 20 in (1, 2) then -0.25::numeric
      else 0::numeric
    end as momentum_bias,
    case persona
      when 'generous' then 0.35::numeric
      when 'critical' then -0.45::numeric
      when 'terse_low_quality' then -0.20::numeric
      when 'explorer' then 0.05::numeric
      else 0::numeric
    end as persona_bias,
    ((((store_no * 41 + review_index * 17 + user_no * 3) % 11) - 5)::numeric * 0.09) as taste_noise,
    ((((store_no * 31 + review_index * 13 + user_no * 5) % 11) - 5)::numeric * 0.08) as service_noise,
    ((((store_no * 23 + review_index * 19 + user_no * 7) % 11) - 5)::numeric * 0.08) as environment_noise
  from review_personas
),
final_reviews as (
  select
    *,
    least(5, greatest(1, round(quality_anchor + persona_bias + momentum_bias + taste_noise + 0.10)::int)) as taste_score,
    least(5, greatest(1, round(quality_anchor + persona_bias + momentum_bias + service_noise - 0.05)::int)) as service_score,
    least(5, greatest(1, round(quality_anchor + persona_bias + momentum_bias + environment_noise)::int)) as environment_score,
    case
      when is_recent_momentum_review then
        timestamp with time zone '2026-06-12 09:00:00+00'
          + ((review_index - (target_reviews - 8)) * interval '2 days')
          + (store_no * interval '20 minutes')
          + case when visit_number = 2 then interval '1 day' else interval '0 days' end
      else
        timestamp with time zone '2026-01-01 09:00:00+00'
          + (store_no * interval '8 hours')
          + (review_index * interval '3 hours')
          + case when visit_number = 2 then interval '7 days' else interval '0 days' end
    end as created_at,
    (store_no * review_index + user_no) % 5 <> 0 as purchase_verified
  from scored_reviews
),
review_payload as (
  select
    *,
    (taste_score * 0.5 + service_score * 0.25 + environment_score * 0.25) as computed_review_score
  from final_reviews
)
insert into public.reviews (
  id,
  store_id,
  user_id,
  taste_score,
  service_score,
  environment_score,
  review_text,
  photo_url,
  visit_type,
  price_satisfaction,
  high_score_reason,
  purchase_verified,
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
  case
    when persona = 'terse_low_quality' or (review_no + user_no) % 17 = 0 then
      case when (review_no + store_no) % 2 = 0 then 'Good.' else 'Okay.' end
    when (review_no + store_no) % 6 = 0 then
      case
        when computed_review_score >= 4.5 then 'Strong visit overall.'
        when computed_review_score >= 3.5 then 'Solid visit overall.'
        else 'Below average today.'
      end
    else
      concat(
        case
          when computed_review_score >= 4.5 then 'This visit landed clearly above the local peer set at '
          when computed_review_score >= 3.5 then 'This visit was reliable but still showed some tradeoffs at '
          else 'This visit exposed quality gaps that should pull the score down for '
        end,
        store_name,
        '. ',
        case persona
          when 'generous' then 'The reviewer is lenient, so the text gives context for the high rating.'
          when 'critical' then 'The reviewer is stricter than average and notes execution details.'
          when 'explorer' then 'The reviewer compares many places and separates taste, service, and environment.'
          when 'terse_low_quality' then 'The reviewer usually writes short notes, which lowers review quality weight.'
          else 'The review gives enough detail to keep the score interpretable.'
        end
      )
  end,
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
      'High score is supported by clear taste, service, or environment strengths.'
    else null
  end,
  purchase_verified,
  (store_no * review_index + user_no) % 113 = 0,
  (store_no + review_index + user_no) % 127 = 0,
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
  photo_url = excluded.photo_url,
  visit_type = excluded.visit_type,
  price_satisfaction = excluded.price_satisfaction,
  high_score_reason = excluded.high_score_reason,
  purchase_verified = excluded.purchase_verified,
  is_hidden = excluded.is_hidden,
  excluded_from_score = excluded.excluded_from_score,
  is_synthetic = true,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

select public.recalculate_profile_stats(id)
from public.profiles
where is_synthetic = true;

select public.set_synthetic_reviews_included(true);

commit;
