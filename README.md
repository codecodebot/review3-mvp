# TrustTable MVP

TrustTable is a Next.js MVP foundation for restaurant and cafe reviews that keeps the original rating visible while applying transparent trust and quality weighting.

The product goal is to reduce rating inflation and compensated-review distortion by showing:

- RAW score: the original weighted average from user reviews
- Normalized score: an average-centered score where the ranking group's RAW average is 3.0
- Taste, service, and environment subscores
- Review count, repeat reviewer rate, trust level, and verification status

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible local components
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Vercel-compatible structure

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is reserved for server-side use only. Do not expose it in browser code.

3. Apply the Supabase migration:

```bash
supabase db push
```

Or paste `supabase/migrations/0001_initial_schema.sql` into the Supabase SQL editor.

If you are applying migrations manually in the hosted SQL editor, run them in filename order:

```text
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_actual_revisit_rate.sql
supabase/migrations/0003_synthetic_review_support.sql
supabase/migrations/0004_average_centered_ranking.sql
```

4. Load sample data:

```bash
supabase db reset
```

The reset command applies migrations and runs `supabase/seed.sql`. If you are using the hosted SQL editor, run the seed file manually after the migration.

5. Optional: load synthetic simulation data for development/demo:

```bash
supabase db execute --file supabase/seed.synthetic.sql
```

Or paste `supabase/seed.synthetic.sql` into the Supabase SQL editor after all migrations,
including `0004_average_centered_ranking.sql`, have been applied.

Do not run `supabase/seed.synthetic.sql` in production. It creates 100 synthetic stores,
1000 demo auth users, and a larger synthetic review set. Synthetic rows are marked with
`stores.is_synthetic = true`, `profiles.is_synthetic = true`, and `reviews.is_synthetic = true`;
demo profile names use the `Demo User 0001` format.

The synthetic seed enables synthetic reviews for demo/dev scoring by setting `scoring_settings.include_synthetic_reviews = true`. This does not change `reviews.excluded_from_score`; admin moderation exclusions stay separate from demo-data inclusion.

To exclude synthetic reviews from score and ranking calculations without deleting them, run:

```sql
select public.set_synthetic_reviews_included(false);
```

The older compatibility wrapper below does the same thing by flipping the scoring setting. It does not mutate `reviews.excluded_from_score`:

```sql
select public.set_synthetic_reviews_excluded(true);
```

To include them again for demo testing:

```sql
select public.set_synthetic_reviews_included(true);
```

To remove synthetic demo data, run:

```sql
delete from public.reviews where is_synthetic = true;
delete from auth.users where email like 'demo.user.%@example.test';
select public.refresh_all_store_scores();
```

6. Start local development:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Main Routes

- `/` explains RAW vs normalized scores
- `/stores` lists stores with region/category filters
- `/stores/[id]` shows detail, subscores, trust, verification, and reviews
- `/stores/[id]/review` creates a review for an authenticated user
- `/login` supports Supabase email/password login and signup
- `/ranking` ranks stores with at least 5 visible reviews
- `/admin` links to moderation tools
- `/admin/reports` resolves reports
- `/admin/reviews` hides reviews or excludes them from scoring
- `/admin/stores` manages verification status and ranking limits

## Scoring Logic

Individual review score:

```text
review_score = taste_score * 0.5 + service_score * 0.25 + environment_score * 0.25
```

Review quality weight ranges from `0.6` to `1.2`:

- text shorter than 10 characters: `0.6`
- text from 10 to 29 characters: `0.8`
- text 30 characters or longer: `1.0`
- photo attached: `+0.1`
- high-score review with required reason: `+0.1`

User trust weight ranges from `0.7` to `1.3`:

- review count >= 5: `+0.05`
- review count >= 20: `+0.10`
- average review length >= 30: `+0.05`
- five-star ratio >= 0.9: `-0.10`
- report count >= 3: `-0.20`
- hidden review count >= 1: `-0.20`

Final review weight:

```text
final_weight = quality_weight * user_weight
```

RAW score:

```text
raw_score = sum(review_score * final_weight) / sum(final_weight)
```

Normalized score:

```text
raw_average = average(raw_score for stores eligible for ranking)
adjusted_score = raw_score - raw_average + 3.0
```

The normalized score is clamped between `1.0` and `5.0`. The average normalized score for
the ranking group should stay near `3.0`; stores above the RAW average land above `3.0`, and
stores below the RAW average land below `3.0`.

Ranking excludes stores with fewer than 5 visible reviews and sorts by normalized score:

```text
ranking_score = adjusted_score
```

Trust level, verification status, and repeat reviewer rate are shown as context badges. They are
not mixed into the normalized score for this MVP ranking view.

Repeat reviewer rate is calculated from review history, not user-selected intent:

```text
unique_reviewers = distinct users with valid reviews for the store
returning_reviewers = users with at least 2 valid reviews for the store, at least 24 hours apart
revisit_rate = returning_reviewers / unique_reviewers
revisit_score = revisit_rate * 5
```

Hidden reviews and reviews excluded from score do not count. If a store has fewer than 3
unique reviewers, `revisit_rate` is stored as `null` and the UI shows `Data insufficient`.

## Database Files

- `supabase/migrations/0001_initial_schema.sql`
  - tables
  - indexes
  - RLS policies
  - helper functions
  - scoring/cache refresh functions
  - review photo storage bucket policies
- `supabase/migrations/0004_average_centered_ranking.sql`
  - average-centered normalized ranking
  - synthetic store marker
  - cache normalization refresh function
- `supabase/seed.sql`
  - 10 stores
  - 5 sample users/profiles
  - 30 sample reviews
- `supabase/seed.synthetic.sql`
  - development/demo-only seed
  - 100 synthetic stores
  - 1000 synthetic users/profiles
  - roughly 6300 deterministic simulated reviews with generous, critical, terse, explorer, and repeat-reviewer behavior
  - hidden/excluded synthetic cases for repeat-review exclusion testing
  - enables synthetic scoring through `scoring_settings.include_synthetic_reviews`

## Synthetic Simulation Seed

`supabase/seed.synthetic.sql` is deterministic and safe to rerun in development: it deletes rows
marked as synthetic and auth users matching `demo.user.%@example.test`, then recreates the same
demo population.

Synthetic scoring inclusion is controlled by `public.scoring_settings.include_synthetic_reviews`. The score refresh functions exclude `reviews.is_synthetic = true` when that setting is false. This is intentionally separate from `reviews.excluded_from_score`, which remains reserved for moderation decisions on individual reviews.

The synthetic distribution is intentionally uneven:

- most visible scores cluster between ordinary positive and very positive ratings
- 100 stores span excellent, average, and lower-quality anchors
- store-level review counts are uneven
- taste, service, and environment scores vary independently
- review text quality varies across short, medium, and long reviews
- some reviews include photo URLs and high-score reasons
- repeat reviewers leave a second valid review at least 24 hours later
- hidden/excluded synthetic reviews demonstrate that invalid reviews do not count toward repeat reviewer rate

## Known MVP Limitations

- Photo upload UI is not implemented; the review form accepts a photo URL for MVP speed.
- Admin pages assume the signed-in profile has `is_admin = true`.
- No AI fake review detection, receipt OCR, GPS verification, crawling, payments, native app, or recommendation engine.
- Score refresh is rule-based and synchronous through database functions/triggers.
