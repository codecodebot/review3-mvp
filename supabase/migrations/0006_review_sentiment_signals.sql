alter table public.reviews
  add column if not exists sentiment_label text,
  add column if not exists sentiment_score numeric,
  add column if not exists negative_signal_count integer not null default 0,
  add column if not exists negative_signals text[],
  add column if not exists rating_text_mismatch boolean not null default false,
  add column if not exists mismatch_reason text,
  add column if not exists mismatch_confidence numeric;

create index if not exists reviews_rating_text_mismatch_idx
  on public.reviews (store_id, rating_text_mismatch)
  where is_hidden = false;

comment on column public.reviews.sentiment_label is
  'Neutral review sentiment label used as a supporting trust signal.';

comment on column public.reviews.rating_text_mismatch is
  'Flags high-rating reviews where negative text signals were detected. This is not fake-review proof.';
