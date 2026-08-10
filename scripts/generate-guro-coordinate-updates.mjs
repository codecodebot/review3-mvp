#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TextDecoder } from "node:util";

const DEFAULT_INPUT = "data/import/guro-restaurants.csv";
const DEFAULT_OUTPUT_DIR = "supabase/generated/guro-coordinate-updates";
const DEFAULT_REGION = "Seoul Guro";
const DEFAULT_BATCH_SIZE = 500;

const FIELD_NAMES = {
  id: "관리번호",
  name: "사업장명",
  status: "영업상태명",
  closedAt: "폐업일자",
  roadAddress: "도로명주소",
  lotAddress: "지번주소",
  category: "업태구분명",
  x: "좌표정보(X)",
  y: "좌표정보(Y)"
};

function parseArgs(argv) {
  const args = {
    batchSize: DEFAULT_BATCH_SIZE,
    input: DEFAULT_INPUT,
    outputDir: DEFAULT_OUTPUT_DIR,
    region: DEFAULT_REGION
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const [flag, inlineValue] = arg.split("=", 2);
    const readValue = () => inlineValue ?? argv[++index];

    switch (flag) {
      case "--batch-size":
        args.batchSize = Number.parseInt(readValue() ?? "", 10) || DEFAULT_BATCH_SIZE;
        break;
      case "--input":
        args.input = readValue() ?? DEFAULT_INPUT;
        break;
      case "--output-dir":
        args.outputDir = readValue() ?? DEFAULT_OUTPUT_DIR;
        break;
      case "--region":
        args.region = readValue() ?? DEFAULT_REGION;
        break;
      default:
        throw new Error(`Unknown option: ${flag}`);
    }
  }

  return args;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
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
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) {
      rows.push(row);
    }
  }

  const headers = rows[0]?.map((header) => cleanText(header).replace(/^\uFEFF/, "")) ?? [];
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cleanText(values[index] ?? "");
    });
    return record;
  });
}

function isOpenBusiness(row) {
  return row[FIELD_NAMES.status] === "영업/정상" && !row[FIELD_NAMES.closedAt];
}

function mapCategory(rawCategory, name) {
  const source = `${rawCategory} ${name}`;

  if (/제과|베이커리|빵|뚜레쥬르|파리바게뜨|브레드/.test(source)) return "Bakery";
  if (/디저트|아이스크림|빙수|케이크|마카롱|도넛/.test(source)) return "Dessert";
  if (/카페|커피|다방|찻집|음료|tea|coffee/i.test(source)) return "Cafe";
  if (/일식|초밥|스시|라멘|이자카야|돈카츠|돈까스|사시미|우동/.test(source)) return "Japanese";
  if (/중식|중국|짜장|자장|짬뽕|마라|탕수육/.test(source)) return "Chinese";
  if (/양식|경양식|파스타|피자|스테이크|버거|브런치|팬케이크|서양/.test(source)) return "Western";

  return "Korean";
}

function parseCoordinate(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
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

function meridionalArc(phi, a, e2) {
  return (
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * phi -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi))
  );
}

function inverseTransverseMercator(x, y) {
  const deg = (value) => (value * Math.PI) / 180;
  const a = 6377397.155;
  const invF = 299.1528128;
  const f = 1 / invF;
  const e2 = 2 * f - f * f;
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const lat0 = deg(38);
  const lon0 = deg(127.00289027777778);
  const k0 = 1;
  const x0 = 200000;
  const y0 = 500000;
  const m0 = meridionalArc(lat0, a, e2);
  const m = m0 + (y - y0) / k0;
  const mu = m / (a * (1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256));
  const fp =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const ep2 = e2 / (1 - e2);
  const c1 = ep2 * Math.cos(fp) ** 2;
  const t1 = Math.tan(fp) ** 2;
  const n1 = a / Math.sqrt(1 - e2 * Math.sin(fp) ** 2);
  const r1 = (a * (1 - e2)) / Math.pow(1 - e2 * Math.sin(fp) ** 2, 1.5);
  const d = (x - x0) / (n1 * k0);
  const lat =
    fp -
    ((n1 * Math.tan(fp)) / r1) *
      (d ** 2 / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ep2) * d ** 4) / 24 +
        ((61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ep2 - 3 * c1 ** 2) * d ** 6) / 720);
  const lng =
    lon0 +
    (d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ep2 + 24 * t1 ** 2) * d ** 5) / 120) /
      Math.cos(fp);

  return {
    lat: (lat * 180) / Math.PI,
    lng: (lng * 180) / Math.PI
  };
}

function toSqlNumber(value) {
  return Number.isFinite(value) ? value.toFixed(7) : "null";
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function normalizeRows(rows, region) {
  const storesByKey = new Map();

  for (const row of rows) {
    const name = row[FIELD_NAMES.name];
    if (!name || !isOpenBusiness(row)) continue;

    const address = row[FIELD_NAMES.roadAddress] || row[FIELD_NAMES.lotAddress] || "";
    const category = mapCategory(row[FIELD_NAMES.category], name);
    const sourceId = row[FIELD_NAMES.id];
    const x = parseCoordinate(row[FIELD_NAMES.x]);
    const y = parseCoordinate(row[FIELD_NAMES.y]);
    if (!x || !y) continue;

    const identity = `${region}|${sourceId || name}|${address}|${category}`;
    const duplicateKey = `${name.toLowerCase()}|${address.toLowerCase()}`;
    if (storesByKey.has(duplicateKey)) continue;

    storesByKey.set(duplicateKey, {
      id: stableUuid(identity),
      ...inverseTransverseMercator(x, y)
    });
  }

  return Array.from(storesByKey.values()).filter(
    (store) => store.lat >= 37.3 && store.lat <= 37.7 && store.lng >= 126.7 && store.lng <= 127.2
  );
}

function buildSql(stores) {
  return [
    "begin;",
    "update public.stores as s",
    "set",
    "  lat = v.lat,",
    "  lng = v.lng,",
    "  updated_at = now()",
    "from (values",
    stores.map((store) => `  (${sqlLiteral(store.id)}::uuid, ${toSqlNumber(store.lat)}::double precision, ${toSqlNumber(store.lng)}::double precision)`).join(",\n"),
    ") as v(id, lat, lng)",
    "where s.id = v.id and s.region = 'Seoul Guro';",
    "commit;",
    ""
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(args.input);
  const outputDir = path.resolve(args.outputDir);
  const text = new TextDecoder("euc-kr").decode(await readFile(inputPath));
  const rows = parseCsv(text);
  const stores = normalizeRows(rows, args.region);
  const batches = chunk(stores, args.batchSize);

  await mkdir(outputDir, { recursive: true });
  await Promise.all(
    batches.map((batch, index) =>
      writeFile(path.join(outputDir, `${String(index + 1).padStart(2, "0")}-guro-coordinates.sql`), buildSql(batch), "utf8")
    )
  );
  await writeFile(
    path.join(outputDir, "99-verify-guro-coordinates.sql"),
    "select count(*) as guro_stores_with_coordinates from public.stores where region = 'Seoul Guro' and lat is not null and lng is not null;\n",
    "utf8"
  );

  console.log(`Rows parsed: ${rows.length}`);
  console.log(`Coordinate updates prepared: ${stores.length}`);
  console.log(`SQL batches written: ${batches.length}`);
  console.log(`Output directory: ${path.relative(process.cwd(), outputDir)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown coordinate generation error.");
  process.exitCode = 1;
});
