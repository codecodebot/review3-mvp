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
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nickname":"Admin Mina"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reviewer1@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nickname":"Joon"}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reviewer2@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nickname":"Sora"}', now(), now()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reviewer3@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nickname":"Leo"}', now(), now()),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reviewer4@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nickname":"Ara"}', now(), now())
on conflict (id) do nothing;

select set_config('app.bypass_profile_protection', 'on', true);

insert into public.profiles (id, nickname, is_admin)
values
  ('11111111-1111-1111-1111-111111111111', 'Admin Mina', true),
  ('22222222-2222-2222-2222-222222222222', 'Joon', false),
  ('33333333-3333-3333-3333-333333333333', 'Sora', false),
  ('44444444-4444-4444-4444-444444444444', 'Leo', false),
  ('55555555-5555-5555-5555-555555555555', 'Ara', false)
on conflict (id) do update
set
  nickname = excluded.nickname,
  is_admin = excluded.is_admin;

insert into public.stores (id, name, category, region, address, verification_status)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Mapo Roastery', 'Cafe', 'Seoul Mapo', '12 Coffee-gil', 'verified'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Quiet Bean Lab', 'Cafe', 'Seoul Mapo', '44 Yeonnam-ro', 'verified'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Gangnam Noodle Bar', 'Korean', 'Seoul Gangnam', '8 Teheran-ro', 'pending'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Jongno Lunch House', 'Korean', 'Seoul Jongno', '2 Insadong-gil', 'verified'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Songdo Pasta Room', 'Western', 'Incheon Songdo', '21 Central-ro', 'pending'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'Haeundae Sushi Stand', 'Japanese', 'Busan Haeundae', '9 Beach-ro', 'verified'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'Cloud Bakery', 'Bakery', 'Seoul Gangnam', '31 Bongeunsa-ro', 'pending'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'Jasmine Dumpling', 'Chinese', 'Seoul Jongno', '18 Sajik-ro', 'verified'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', 'Fig Dessert Table', 'Dessert', 'Seoul Mapo', '73 Worldcup-ro', 'pending'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10', 'Harbor Filter Cafe', 'Cafe', 'Busan Haeundae', '5 Marine City', 'pending')
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  region = excluded.region,
  address = excluded.address,
  verification_status = excluded.verification_status;

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
  created_at
)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', 5, 5, 4, 'Excellent espresso balance and staff explained the beans clearly.', 'https://example.com/photos/mapo-roastery-1.jpg', 'friends', 'good', 'Excellent flavor clarity and consistent service made the score feel earned.', now() - interval '30 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '33333333-3333-3333-3333-333333333333', 5, 4, 4, 'Strong pour-over, comfortable seats, slightly crowded after lunch.', null, 'solo', 'fair', 'Coffee quality was high and the visit felt reliably good.', now() - interval '29 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '44444444-4444-4444-4444-444444444444', 4, 4, 5, 'Calm room and good dessert pairing. Taste was not flashy but very solid.', null, 'date', 'fair', null, now() - interval '28 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '55555555-5555-5555-5555-555555555555', 5, 5, 5, 'Near perfect visit with careful brewing and quiet music.', 'https://example.com/photos/mapo-roastery-4.jpg', 'solo', 'good', 'Every part of the visit matched the high score, especially the taste.', now() - interval '27 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', 4, 5, 4, 'Friendly service and a clean finish in the latte.', null, 'business', 'good', null, now() - interval '26 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '33333333-3333-3333-3333-333333333333', 5, 4, 5, 'The signature blend is memorable and the room is easy to settle into.', null, 'friends', 'fair', 'The taste and environment were both strong enough to justify it.', now() - interval '25 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 4, 3, 5, 'Quiet and pretty, but the coffee was only moderately distinct.', null, 'solo', 'fair', null, now() - interval '24 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '33333333-3333-3333-3333-333333333333', 3, 4, 5, 'Great space for reading. Service was kind, taste was fine.', null, 'solo', 'good', null, now() - interval '23 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '44444444-4444-4444-4444-444444444444', 4, 4, 4, 'Balanced visit overall, not inflated, easy to recommend for atmosphere.', null, 'friends', 'fair', null, now() - interval '22 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '55555555-5555-5555-5555-555555555555', 2, 4, 5, 'Beautiful cafe, but my iced drink tasted watery.', null, 'date', 'poor', null, now() - interval '21 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 4, 4, 5, 'Good seating, good pacing, and a pleasant filter coffee.', 'https://example.com/photos/quiet-bean-5.jpg', 'business', 'fair', null, now() - interval '20 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '33333333-3333-3333-3333-333333333333', 5, 3, 3, 'Noodles had deep broth but the queue management was messy.', null, 'friends', 'good', null, now() - interval '19 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '44444444-4444-4444-4444-444444444444', 5, 4, 3, 'Flavor is excellent for the price. Seating is cramped.', null, 'solo', 'good', null, now() - interval '18 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb014', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '55555555-5555-5555-5555-555555555555', 4, 2, 3, 'Food was good, service felt rushed and confused.', null, 'business', 'fair', null, now() - interval '17 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '22222222-2222-2222-2222-222222222222', 5, 4, 4, 'The broth is rich and consistent. I would return.', 'https://example.com/photos/noodle-4.jpg', 'friends', 'good', 'Taste was strong enough that the high rating is mainly food-driven.', now() - interval '16 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb016', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '33333333-3333-3333-3333-333333333333', 3, 3, 3, 'Average lunch. Nothing bad, nothing especially memorable.', null, 'solo', 'fair', null, now() - interval '15 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb017', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '44444444-4444-4444-4444-444444444444', 4, 5, 3, 'Homestyle dishes and very attentive service.', null, 'family', 'good', null, now() - interval '14 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb018', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '55555555-5555-5555-5555-555555555555', 4, 4, 3, 'Reliable lunch spot, a little loud at noon.', null, 'business', 'fair', null, now() - interval '13 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb019', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '22222222-2222-2222-2222-222222222222', 3, 4, 3, 'Fine but plain. The side dishes were the best part.', null, 'family', 'fair', null, now() - interval '12 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '33333333-3333-3333-3333-333333333333', 4, 3, 4, 'Nice pasta texture, service timing needs polish.', null, 'date', 'fair', null, now() - interval '11 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '44444444-4444-4444-4444-444444444444', 5, 4, 4, 'The ragu was deep and well seasoned.', 'https://example.com/photos/pasta-2.jpg', 'date', 'good', 'The main dish was excellent and carried the visit.', now() - interval '10 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb022', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '55555555-5555-5555-5555-555555555555', 3, 3, 4, 'Comfortable room, but portions felt small.', null, 'friends', 'poor', null, now() - interval '9 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb023', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '22222222-2222-2222-2222-222222222222', 5, 4, 3, 'Fresh fish and fast turnover. Not much atmosphere.', null, 'solo', 'good', null, now() - interval '8 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb024', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '33333333-3333-3333-3333-333333333333', 4, 4, 3, 'Good value sushi for the area.', null, 'friends', 'good', null, now() - interval '7 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb025', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '44444444-4444-4444-4444-444444444444', 5, 5, 4, 'Pastries were crisp and the staff handled a busy morning well.', null, 'friends', 'fair', 'Taste and service both stood out clearly.', now() - interval '6 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb026', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '55555555-5555-5555-5555-555555555555', 4, 3, 4, 'Good croissant, coffee pairing was ordinary.', null, 'solo', 'fair', null, now() - interval '5 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb027', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', '22222222-2222-2222-2222-222222222222', 3, 3, 3, 'Dumplings were acceptable, nothing special.', null, 'friends', 'fair', null, now() - interval '4 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb028', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', '33333333-3333-3333-3333-333333333333', 4, 3, 3, 'Good chili oil and quick service.', null, 'solo', 'good', null, now() - interval '3 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb029', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', '44444444-4444-4444-4444-444444444444', 5, 4, 5, 'Desserts look polished and the fig tart tasted as good as it looked.', 'https://example.com/photos/fig-dessert-1.jpg', 'date', 'fair', 'The dessert quality and presentation were both excellent.', now() - interval '2 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb030', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10', '55555555-5555-5555-5555-555555555555', 3, 4, 4, 'Nice harbor view, coffee is fine but not destination-worthy.', null, 'solo', 'fair', null, now() - interval '1 day')
on conflict (id) do nothing;

select public.recalculate_profile_stats(id) from public.profiles;
select public.refresh_all_store_scores();
