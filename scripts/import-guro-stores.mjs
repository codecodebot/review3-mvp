#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TextDecoder } from "node:util";

const DEFAULT_REGION = "Seoul Guro";
const DEFAULT_OUTPUT = "supabase/generated/guro-stores.upsert.sql";
const DEFAULT_SOURCE_URL =
  "https://www.data.go.kr/data/15148064/fileData.do?recommendDataYn=Y";
const DEFAULT_ENCODING = "utf-8";
const DEFAULT_BATCH_SIZE = 500;
const VALID_VERIFICATION_STATUSES = new Set(["pending", "verified", "rejected"]);

const FIELD_CANDIDATES = {
  id: ["관리번호", "번호", "인허가번호", "관리ID", "id", "license_id"],
  name: ["사업장명", "업소명", "상호명", "가게명", "매장명", "name", "store_name"],
  category: ["업태구분명", "위생업태명", "업종명", "업종", "category", "개방서비스명"],
  address: [
    "도로명전체주소",
    "도로명주소",
    "소재지전체주소",
    "소재지주소",
    "지번주소",
    "주소",
    "address",
    "road_address"
  ],
  status: ["영업상태명", "상세영업상태명", "영업상태", "상태명", "상태", "status"],
  closedAt: ["폐업일자", "인허가취소일자", "휴업시작일자", "closed_at", "close_date"],
  lat: ["위도", "latitude", "lat", "y", "좌표정보(y)", "좌표정보Y"],
  lng: ["경도", "longitude", "lng", "lon", "x", "좌표정보(x)", "좌표정보X"]
};

function printHelp() {
  console.log(`
Usage:
  npm run import:guro -- --input ./data/import/guro.csv

Options:
  --input <path>                  CSV or JSON source file. Required.
  --output <path>                 SQL output path. Default: ${DEFAULT_OUTPUT}
  --encoding <label>              Text encoding. Default: ${DEFAULT_ENCODING}. Try euc-kr for Korean CSV files.
  --format <csv|json|auto>        Input format. Default: auto.
  --limit <number>                Keep only the first N normalized active stores.
  --batch-size <number>           INSERT batch size. Default: ${DEFAULT_BATCH_SIZE}
  --region <value>                Store region value. Default: ${DEFAULT_REGION}
  --verification-status <value>   pending, verified, or rejected. Default: pending.
  --source-url <url>              Source URL comment written into the generated SQL.
  --include-closed                Do not filter closed/suspended businesses.
  --dry-run                       Parse and summarize without writing SQL.
  --help                          Show this help.
`);
}

function parseArgs(argv) {
  const args = {
    batchSize: DEFAULT_BATCH_SIZE,
    dryRun: false,
    encoding: DEFAULT_ENCODING,
    format: "auto",
    includeClosed: false,
    input: null,
    limit: null,
    output: DEFAULT_OUTPUT,
    region: DEFAULT_REGION,
    sourceUrl: DEFAULT_SOURCE_URL,
    verificationStatus: "pending"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const rawArg = argv[index];
    if (!rawArg.startsWith("--")) {
      continue;
    }

    const equalsIndex = rawArg.indexOf("=");
    const flag = equalsIndex === -1 ? rawArg : rawArg.slice(0, equalsIndex);
    const inlineValue = equalsIndex === -1 ? undefined : rawArg.slice(equalsIndex + 1);
    const readValue = () => {
      if (inlineValue !== undefined) {
        return inlineValue;
      }
      index += 1;
      return argv[index];
    };

    switch (flag) {
      case "--batch-size":
        args.batchSize = toPositiveInt(readValue(), DEFAULT_BATCH_SIZE);
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--encoding":
        args.encoding = readValue() ?? DEFAULT_ENCODING;
        break;
      case "--format":
        args.format = readValue() ?? "auto";
        break;
      case "--help":
        args.help = true;
        break;
      case "--include-closed":
        args.includeClosed = true;
        break;
      case "--input":
        args.input = readValue();
        break;
      case "--limit":
        args.limit = toPositiveInt(readValue(), null);
        break;
      case "--output":
        args.output = readValue() ?? DEFAULT_OUTPUT;
        break;
      case "--region":
        args.region = readValue() ?? DEFAULT_REGION;
        break;
      case "--source-url":
        args.sourceUrl = readValue() ?? DEFAULT_SOURCE_URL;
        break;
      case "--verification-status":
        args.verificationStatus = readValue() ?? "pending";
        break;
      default:
        throw new Error(`Unknown option: ${flag}`);
    }
  }

  return args;
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function decodeFile(buffer, encoding) {
  try {
    return new TextDecoder(encoding).decode(buffer);
  } catch {
    if (encoding.toLowerCase() !== DEFAULT_ENCODING) {
      throw new Error(
        `Unable to decode the input file with "${encoding}". Save the file as UTF-8 CSV or try another encoding.`
      );
    }
    return buffer.toString("utf8");
  }
}

function inferFormat(filePath, requestedFormat) {
  if (requestedFormat !== "auto") {
    return requestedFormat;
  }
  const extension = path.extname(filePath).toLowerCase();
  return extension === ".json" ? "json" : "csv";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => cleanText(header).replace(/^\uFEFF/, ""));
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cleanText(values[index] ?? "");
    });
    return record;
  });
}

function parseJson(text) {
  const parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
  if (Array.isArray(parsed)) {
    return parsed.filter(isObjectRecord);
  }

  const arrays = [];
  collectObjectArrays(parsed, arrays);
  arrays.sort((left, right) => right.length - left.length);
  return arrays[0] ?? [];
}

function collectObjectArrays(value, arrays) {
  if (Array.isArray(value)) {
    if (value.some(isObjectRecord)) {
      arrays.push(value.filter(isObjectRecord));
    }
    value.forEach((item) => collectObjectArrays(item, arrays));
    return;
  }

  if (isObjectRecord(value)) {
    Object.values(value).forEach((item) => collectObjectArrays(item, arrays));
  }
}

function isObjectRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeHeader(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[\s_\-().,[\]{}<>\/\\:：]/g, "");
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function findValue(row, candidates) {
  const entries = Object.entries(row);
  const normalizedCandidates = candidates.map(normalizeHeader);

  for (const candidate of normalizedCandidates) {
    const exactMatch = entries.find(([key]) => normalizeHeader(key) === candidate);
    if (exactMatch) {
      return cleanText(exactMatch[1]);
    }
  }

  for (const candidate of normalizedCandidates) {
    const partialMatch = entries.find(([key]) => normalizeHeader(key).includes(candidate));
    if (partialMatch) {
      return cleanText(partialMatch[1]);
    }
  }

  return "";
}

function isOpenBusiness(row, includeClosed) {
  if (includeClosed) {
    return true;
  }

  const status = findValue(row, FIELD_CANDIDATES.status);
  const closedAt = findValue(row, FIELD_CANDIDATES.closedAt);
  const signal = `${status} ${closedAt}`;

  if (closedAt) {
    return false;
  }

  if (/폐업|취소|말소|정지|휴업|직권|만료/.test(signal)) {
    return false;
  }

  return true;
}

function mapCategory(rawCategory, name) {
  const source = `${rawCategory} ${name}`;

  if (/제과|베이커리|빵|파리바게뜨|뚜레쥬르|브레드/.test(source)) {
    return "Bakery";
  }
  if (/디저트|아이스크림|빙수|도넛|케이크|마카롱|와플|젤라또/.test(source)) {
    return "Dessert";
  }
  if (/카페|커피|다방|휴게|찻집|티하우스|음료|tea|coffee/i.test(source)) {
    return "Cafe";
  }
  if (/일식|초밥|스시|라멘|이자카야|돈카츠|돈까스|회|사시미|우동|소바/.test(source)) {
    return "Japanese";
  }
  if (/중식|중국|짜장|자장|짬뽕|마라|양꼬치|훠궈/.test(source)) {
    return "Chinese";
  }
  if (/양식|경양식|이탈|파스타|피자|스테이크|버거|브런치|패스트푸드|서양/.test(source)) {
    return "Western";
  }

  return "Korean";
}

function parseCoordinate(value, type) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (type === "lat" && parsed >= 33 && parsed <= 39) {
    return parsed;
  }
  if (type === "lng" && parsed >= 124 && parsed <= 132) {
    return parsed;
  }

  return null;
}

function stableUuid(input) {
  const hash = createHash("sha1").update(input).digest("hex").slice(0, 32);
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20)
  ].join("-");
}

function normalizeStores(rows, options) {
  const storesByIdentity = new Map();
  const skipped = {
    closed: 0,
    missingAddress: 0,
    missingName: 0
  };

  for (const row of rows) {
    const name = findValue(row, FIELD_CANDIDATES.name);
    if (!name) {
      skipped.missingName += 1;
      continue;
    }

    if (!isOpenBusiness(row, options.includeClosed)) {
      skipped.closed += 1;
      continue;
    }

    const address = findValue(row, FIELD_CANDIDATES.address);
    if (!address) {
      skipped.missingAddress += 1;
    }

    const rawCategory = findValue(row, FIELD_CANDIDATES.category);
    const category = mapCategory(rawCategory, name);
    const sourceId = findValue(row, FIELD_CANDIDATES.id);
    const lat = parseCoordinate(findValue(row, FIELD_CANDIDATES.lat), "lat");
    const lng = parseCoordinate(findValue(row, FIELD_CANDIDATES.lng), "lng");
    const identity = `${options.region}|${sourceId || name}|${address}|${category}`;
    const duplicateKey = `${name.toLowerCase()}|${address.toLowerCase()}`;

    if (storesByIdentity.has(duplicateKey)) {
      continue;
    }

    storesByIdentity.set(duplicateKey, {
      address: address || null,
      category,
      id: stableUuid(identity),
      isSynthetic: false,
      lat,
      lng,
      name,
      rankingLimited: false,
      region: options.region,
      verificationStatus: options.verificationStatus
    });
  }

  const stores = Array.from(storesByIdentity.values());
  return {
    skipped,
    stores: options.limit ? stores.slice(0, options.limit) : stores
  };
}

function sqlLiteral(value) {
  if (value === null || value === undefined) {
    return "null";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  return Number.isFinite(value) ? String(value) : "null";
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function buildStoreValues(stores) {
  return stores
    .map(
      (store) =>
        `  (${sqlLiteral(store.id)}, ${sqlLiteral(store.name)}, ${sqlLiteral(store.category)}, ` +
        `${sqlLiteral(store.region)}, ${sqlLiteral(store.address)}, ${sqlNumber(store.lat)}, ` +
        `${sqlNumber(store.lng)}, ${sqlLiteral(store.verificationStatus)}, ` +
        `${store.rankingLimited ? "true" : "false"}, ${store.isSynthetic ? "true" : "false"}, now())`
    )
    .join(",\n");
}

function buildCacheValues(stores) {
  return stores
    .map((store) => `  (${sqlLiteral(store.id)}, 0, 0, 3, 0, 0, 'unknown', 0, now())`)
    .join(",\n");
}

function buildSql(stores, options, summary) {
  const sql = [
    "-- Generated by scripts/import-guro-stores.mjs",
    "-- Review this SQL before running it in Supabase SQL Editor.",
    "-- Source data should be reviewed for license/attribution requirements before production use.",
    `-- Source: ${options.sourceUrl}`,
    `-- Region: ${options.region}`,
    `-- Generated at: ${new Date().toISOString()}`,
    `-- Parsed rows: ${summary.parsedRows}`,
    `-- Active stores in this file: ${stores.length}`,
    "",
    "begin;",
    ""
  ];

  for (const storeBatch of chunk(stores, options.batchSize)) {
    sql.push(
      "insert into public.stores (",
      "  id, name, category, region, address, lat, lng, verification_status,",
      "  ranking_limited, is_synthetic, updated_at",
      ")",
      "values",
      buildStoreValues(storeBatch),
      "on conflict (id) do update set",
      "  name = excluded.name,",
      "  category = excluded.category,",
      "  region = excluded.region,",
      "  address = excluded.address,",
      "  lat = excluded.lat,",
      "  lng = excluded.lng,",
      "  verification_status = excluded.verification_status,",
      "  ranking_limited = excluded.ranking_limited,",
      "  is_synthetic = excluded.is_synthetic,",
      "  updated_at = now();",
      ""
    );
  }

  for (const storeBatch of chunk(stores, options.batchSize)) {
    sql.push(
      "insert into public.store_score_cache (",
      "  store_id, raw_score, bayesian_raw_score, adjusted_score, ranking_score,",
      "  review_count, trust_level, peer_average_raw_score, updated_at",
      ")",
      "values",
      buildCacheValues(storeBatch),
      "on conflict (store_id) do nothing;",
      ""
    );
  }

  sql.push("commit;", "");
  return sql.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.input) {
    printHelp();
    throw new Error("Missing required --input <path>.");
  }

  if (!VALID_VERIFICATION_STATUSES.has(args.verificationStatus)) {
    throw new Error("--verification-status must be one of: pending, verified, rejected.");
  }

  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  const format = inferFormat(inputPath, args.format);
  const buffer = await readFile(inputPath);
  const text = decodeFile(buffer, args.encoding);
  const rows = format === "json" ? parseJson(text) : parseCsv(text);
  const normalized = normalizeStores(rows, args);

  if (normalized.stores.length === 0) {
    throw new Error("No active stores were found. Check the input columns, encoding, or --include-closed option.");
  }

  const summary = {
    parsedRows: rows.length,
    skipped: normalized.skipped,
    stores: normalized.stores.length
  };

  console.log(`Parsed rows: ${summary.parsedRows}`);
  console.log(`Active stores prepared: ${summary.stores}`);
  console.log(`Skipped closed/suspended rows: ${summary.skipped.closed}`);
  console.log(`Skipped rows without a name: ${summary.skipped.missingName}`);
  console.log(`Rows without an address kept: ${summary.skipped.missingAddress}`);

  if (args.dryRun) {
    console.log("Dry run complete. No SQL file was written.");
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buildSql(normalized.stores, args, summary), "utf8");
  console.log(`SQL written to: ${path.relative(process.cwd(), outputPath)}`);
  console.log("Review the generated SQL before running it in Supabase SQL Editor.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown import error.");
  process.exitCode = 1;
});
