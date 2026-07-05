# TrustTable MVP

TrustTable is a Next.js MVP foundation for restaurant and cafe reviews that keeps the original rating visible while applying transparent trust and quality weighting.

The product goal is to reduce rating inflation and compensated-review distortion by showing:

- RAW score: the original weighted average from user reviews
- Adjusted score: a peer-normalized score centered around 3.0
- Taste, service, and environment subscores
- Review count, revisit intent rate, trust level, and verification status

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

4. Load sample data:

```bash
supabase db reset
```

The reset command applies migrations and runs `supabase/seed.sql`. If you are using the hosted SQL editor, run the seed file manually after the migration.

5. Start local development:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Main Routes

- `/` explains RAW vs adjusted scores
- `/stores` lists stores with region/category filters
- `/stores/[id]` shows detail, subscores, trust, verification, and reviews
- `/stores/[id]/review` creates a review for an authenticated user
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
- revisit intent answered: `+0.05`

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

Bayesian RAW score uses `m = 20`:

```text
bayesian_raw_score = (review_count * raw_score + 20 * peer_average_raw_score) / (review_count + 20)
```

Adjusted score:

```text
adjusted_score = 3 + 0.8 * (bayesian_raw_score - peer_average_raw_score)
```

The adjusted score is clamped between `1.0` and `5.0`.

Peer average fallback order:

1. Same region and same category, if at least 30 peer reviews
2. Same category, if at least 30 peer reviews
3. Global average, if at least 30 reviews
4. Fallback `3.0`

Ranking excludes stores with fewer than 5 visible reviews and uses:

```text
ranking_score = adjusted_score * 0.75 + revisit_score * 0.10 + trust_score * 0.15
```

## Database Files

- `supabase/migrations/0001_initial_schema.sql`
  - tables
  - indexes
  - RLS policies
  - helper functions
  - scoring/cache refresh functions
  - review photo storage bucket policies
- `supabase/seed.sql`
  - 10 stores
  - 5 sample users/profiles
  - 30 sample reviews

## Known MVP Limitations

- No custom login/signup UI is included yet.
- Photo upload UI is not implemented; the review form accepts a photo URL for MVP speed.
- Admin pages assume the signed-in profile has `is_admin = true`.
- No AI fake review detection, receipt OCR, GPS verification, crawling, payments, native app, or recommendation engine.
- Score refresh is rule-based and synchronous through database functions/triggers.
