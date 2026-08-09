# Guro-gu Store Import

This folder is for local source files only. CSV/JSON source files are ignored by Git so public
data downloads do not accidentally become part of the repository.

## Recommended Source

- Public Data Portal: `서울특별시 구로구_일반음식점 인허가 정보`
  - https://www.data.go.kr/data/15148064/fileData.do?recommendDataYn=Y
- Seoul Open Data Plaza source page:
  - https://data.seoul.go.kr/dataList/OA-18668/S/1/datasetView.do

Use only legally available public data. Do not crawl Naver, Kakao, Google, or other review
platforms for this MVP.

## Workflow

1. Download the Guro-gu restaurant permit file as CSV or JSON.
2. Save the file into this folder, preferably as UTF-8 CSV.
3. Generate SQL locally:

```bash
npm run import:guro -- --input data/import/guro-restaurants.csv
```

If the CSV is encoded as Korean EUC-KR/CP949, try:

```bash
npm run import:guro -- --input data/import/guro-restaurants.csv --encoding euc-kr
```

For a smaller MVP import:

```bash
npm run import:guro -- --input data/import/guro-restaurants.csv --limit 1000
```

4. Review the generated SQL:

```text
supabase/generated/guro-stores.upsert.sql
```

5. In Supabase Dashboard, open SQL Editor, paste the reviewed SQL, and run it.

The generated SQL only upserts `public.stores` and creates empty `public.store_score_cache`
rows. It does not insert reviews, profiles, reports, or secrets. Imported stores use:

```text
region = 'Seoul Guro'
verification_status = 'pending'
is_synthetic = false
```

After importing, refresh scores if needed:

```sql
select public.refresh_all_store_scores();
```

## Notes

- Public permit coordinates may be projected local coordinates instead of latitude/longitude.
  The importer only keeps plausible WGS84 latitude/longitude values and otherwise stores `null`.
- Ranking still requires enough visible reviews, so newly imported stores may appear in the store
  list before they appear in ranking.
