// Parses a CSV or XLSX file in-browser and produces a validated portfolio.
//
// Design goals:
//  - Be permissive about header names: a user's real file rarely matches a spec
//    exactly, so we accept many aliases for each canonical field.
//  - Be strict about row-level integrity: if a row is unusable we surface a
//    clear, row-numbered error and skip that row.
//  - Be transparent: every field mapping decision is captured in fieldMappings,
//    and any defaults we applied surface as file-level warnings.

import Papa from "papaparse";
import * as XLSX from "xlsx";
import type {
  AssetClass,
  CoreSatellite,
  FieldMappingTrace,
  Holding,
  HoldingStatus,
  ParseError,
  ParseResult,
  ParseWarning,
} from "./portfolioTypes";
import { currencyForGeography, determineBaseCurrency, fxConvert } from "./fx";

// ---------------------------------------------------------------------------
// Column alias map. Keys are canonical field names; values are alternate
// header strings users actually write. Comparison is case + punctuation
// insensitive (see normalizeHeader).
// ---------------------------------------------------------------------------

const COLUMN_ALIASES: Record<string, string[]> = {
  ticker: ["ticker", "symbol", "scrip", "code", "tickersymbol"],
  companyName: ["companyname", "company", "name", "security", "securityname", "instrument", "stock"],
  assetClass: ["assetclass", "type", "instrumenttype", "category"],
  sector: ["sector", "industry", "gics", "gicssector"],
  geography: ["geography", "geo", "country", "region", "market"],
  quantity: ["quantity", "qty", "shares", "units", "holdings", "position"],
  averageCost: ["averagecost", "avgcost", "avgprice", "averageprice", "cost", "costprice", "buyprice"],
  currentPrice: ["currentprice", "cmp", "ltp", "lasttradedprice", "price", "marketprice", "mktprice", "currentmarketprice"],
  marketValue: ["marketvalue", "mktvalue", "mv", "value", "currentvalue", "positionvalue"],
  portfolioWeight: ["portfolioweight", "weight", "weightpct", "weightpercent", "wt", "allocation"],
  coreSatellite: ["coresatellite", "coresat", "classification", "bucket", "sleeve"],
  benchmark: ["benchmark", "bench", "index"],
  status: ["status", "holdingstatus", "actiontoday", "action"],
};

const REQUIRED_PER_ROW = ["ticker", "companyName", "quantity", "currentPrice"] as const;
const REQUIRED_FIELDS_FOR_VALIDATION = ["ticker", "companyName", "sector", "quantity", "currentPrice", "coreSatellite", "status"] as const;

function normalizeHeader(s: string): string {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Given the raw header row, build a map: canonicalField -> sourceHeader (first match wins).
function buildHeaderMap(headers: string[]): { map: Record<string, string>; trace: FieldMappingTrace[] } {
  const normalized = headers.map(normalizeHeader);
  const map: Record<string, string> = {};
  const trace: FieldMappingTrace[] = [];

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx >= 0 && !(canonical in map)) {
        map[canonical] = headers[idx];
        trace.push({ canonical: canonical as keyof Holding, source: headers[idx] });
        break;
      }
    }
  }

  // Headers that didn't map to anything — record as unmapped (kept as extras).
  const claimedSources = new Set(Object.values(map));
  for (const h of headers) {
    if (!h) continue;
    if (!claimedSources.has(h)) trace.push({ canonical: "unmapped", source: h });
  }

  return { map, trace };
}

// ---------------------------------------------------------------------------
// Value coercion helpers.
// ---------------------------------------------------------------------------

function toCleanString(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "n/a" || s.toLowerCase() === "na" || s === "-") return null;
  // Strip currency symbols, commas, percent signs.
  const cleaned = s.replace(/[,₹$€£\s%]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeCoreSatellite(raw: string): CoreSatellite | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith("core")) return "Core";
  if (s.startsWith("sat")) return "Satellite";
  // Some files (like the user's) put the owner's name here — we can't infer.
  return null;
}

function normalizeStatus(raw: string): HoldingStatus | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith("curr") || s === "hold" || s === "active" || s === "holding") return "Current";
  if (s.startsWith("exit") || s === "sold" || s === "closed" || s === "sell") return "Exited";
  if (s.startsWith("watch") || s === "monitor" || s === "tracking") return "Watchlist";
  // "Buy"/"Add on Weakness"/"Trim" — these are recommendations, not status.
  // Treat them as Current since you still own the holding.
  if (s === "buy" || s === "add on weakness" || s === "addonweakness" || s === "trim") return "Current";
  return null;
}

function normalizeAssetClass(raw: string): AssetClass {
  const s = raw.trim().toLowerCase();
  if (!s) return "Equity";
  if (s.includes("etf")) return "ETF";
  if (s.includes("bond") || s.includes("debt") || s.includes("fixed")) return "Bond";
  if (s === "cash") return "Cash";
  if (s.includes("comm") || s.includes("gold") || s.includes("silver")) return "Commodity";
  if (s.includes("alt") || s.includes("real estate") || s.includes("reit")) return "Alternative";
  if (s.includes("eq") || s.includes("share") || s.includes("stock")) return "Equity";
  return "Equity";
}

// Best-effort geography inference from a ticker string. Used only when no
// geography column is present in the file.
function inferGeography(ticker: string): string {
  const t = ticker.toUpperCase();
  if (/\.NS$|\.BO$/.test(t)) return "India";
  if (/\.L$/.test(t)) return "UK";
  if (/\.HK$/.test(t)) return "Hong Kong";
  if (/\.TO$/.test(t)) return "Canada";
  // Many Indian custodians emit 4–6 letter uppercase codes (TILIND, HDFBAN).
  // If it doesn't look like a US ticker (≤5 chars, often with vowels), guess India.
  if (t.length >= 5 && t.length <= 6 && /^[A-Z]+$/.test(t) && !/^[A-Z]{1,4}$/.test(t)) {
    return "India";
  }
  return "Unknown";
}

function inferBenchmarkFromGeography(g: string): string {
  if (g === "India") return "NIFTY 50";
  if (g === "US") return "S&P 500";
  if (g === "UK") return "FTSE 100";
  if (g === "Hong Kong") return "Hang Seng";
  return "S&P 500";
}

// Simple FNV-1a checksum over the canonical row payload. Stable across runs.
function checksumOf(rows: Holding[]): string {
  let h = 0x811c9dc5;
  const str = rows
    .map((r) => `${r.ticker}|${r.quantity}|${r.currentPrice}|${r.coreSatellite}|${r.status}`)
    .join("\n");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

// ---------------------------------------------------------------------------
// File ingestion. Routes by extension; both paths produce a uniform
// rows + headers shape that the row-converter below consumes.
// ---------------------------------------------------------------------------

type RawTable = { headers: string[]; rows: Record<string, unknown>[] };

async function readCSV(file: File): Promise<RawTable> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        const headers = (results.meta.fields || []).map((h) => h.trim());
        const rows = (results.data as Record<string, unknown>[]).map((r) => {
          const out: Record<string, unknown> = {};
          for (const h of headers) out[h] = r[h];
          return out;
        });
        resolve({ headers, rows });
      },
      error: (err) => reject(err),
    });
  });
}

async function readXLSX(file: File): Promise<RawTable> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) throw new Error("XLSX file contains no sheets");
  const ws = wb.Sheets[firstSheet];
  const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: false,
  });
  // XLSX.utils.sheet_to_json strips empty trailing rows but preserves header order.
  const headers = sheetRows.length
    ? Object.keys(sheetRows[0]).map((h) => h.trim())
    : [];
  return { headers, rows: sheetRows };
}

// ---------------------------------------------------------------------------
// Main entry point.
// ---------------------------------------------------------------------------

export async function parsePortfolioFile(file: File): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  let raw: RawTable;
  if (ext === "xlsx" || ext === "xls") {
    raw = await readXLSX(file);
  } else if (ext === "csv" || ext === "txt") {
    raw = await readCSV(file);
  } else {
    throw new Error(`Unsupported file type: .${ext}. Upload a CSV or XLSX file.`);
  }
  return parseRawTable(raw, file.name);
}

export function parseRawTable(raw: RawTable, fileName: string): ParseResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  const { map, trace } = buildHeaderMap(raw.headers);

  // File-level warnings for missing required columns. We treat sector,
  // coreSatellite, and status as derivable — we'll apply defaults and warn.
  for (const field of REQUIRED_FIELDS_FOR_VALIDATION) {
    if (!(field in map)) {
      warnings.push({
        field,
        message:
          field === "sector"
            ? "No 'sector' column found — every holding will be tagged 'Unclassified'. Re-upload with a Sector column for accurate sector analytics."
            : field === "coreSatellite"
              ? "No 'Core/Satellite' column found — every holding defaulted to 'Core'. Edit your file and re-upload to set sleeve classifications."
              : field === "status"
                ? "No 'status' column found — every holding defaulted to 'Current' (active holding)."
                : `Required column '${field}' is missing.`,
      });
    }
  }

  // Per-row conversion.
  const holdings: Holding[] = [];
  raw.rows.forEach((row, idx) => {
    const rowNum = idx + 2; // header is row 1, so row data starts at 2
    const get = (canonical: string): unknown => {
      const src = map[canonical];
      return src ? row[src] : undefined;
    };

    const ticker = toCleanString(get("ticker")).toUpperCase();
    const companyName = toCleanString(get("companyName"));
    const quantity = toNumber(get("quantity"));
    const currentPrice = toNumber(get("currentPrice"));

    // Hard validations — without these we cannot produce a usable row.
    const rowErrors: ParseError[] = [];
    if (!ticker) rowErrors.push({ row: rowNum, field: "ticker", message: "Ticker is required." });
    if (!companyName)
      rowErrors.push({ row: rowNum, ticker, field: "companyName", message: "Company name is required." });
    if (quantity == null || quantity < 0)
      rowErrors.push({ row: rowNum, ticker, field: "quantity", message: "Quantity must be a non-negative number." });
    if (currentPrice == null || currentPrice < 0)
      rowErrors.push({ row: rowNum, ticker, field: "currentPrice", message: "Current price must be a non-negative number." });

    if (rowErrors.length) {
      errors.push(...rowErrors);
      return;
    }

    // At this point qty/currentPrice are non-null numbers.
    const qty = quantity as number;
    const cmp = currentPrice as number;
    const averageCost = toNumber(get("averageCost")) ?? cmp;
    const providedMV = toNumber(get("marketValue"));
    const marketValue = providedMV != null ? providedMV : qty * cmp;
    const sector = toCleanString(get("sector")) || "Unclassified";
    const geographyRaw = toCleanString(get("geography"));
    const geography = geographyRaw || inferGeography(ticker);
    const assetClass = normalizeAssetClass(toCleanString(get("assetClass")));
    const benchmark = toCleanString(get("benchmark")) || inferBenchmarkFromGeography(geography);

    const csRaw = toCleanString(get("coreSatellite"));
    const coreSatellite: CoreSatellite = normalizeCoreSatellite(csRaw) ?? "Core";

    const statusRaw = toCleanString(get("status"));
    const status: HoldingStatus = normalizeStatus(statusRaw) ?? "Current";

    // Track unmapped columns as extras so downstream views can show them.
    const extra: Record<string, string | number | null> = {};
    for (const t of trace) {
      if (t.canonical === "unmapped") {
        const v = row[t.source];
        if (v != null && String(v).trim() !== "") {
          const num = toNumber(v);
          extra[t.source] = num != null ? num : String(v).trim();
        }
      }
    }

    const costBasis = qty * averageCost;
    const unrealizedPnL = qty * (cmp - averageCost);
    const returnPct = averageCost > 0 ? ((cmp - averageCost) / averageCost) * 100 : 0;
    const currency = currencyForGeography(geography);

    const h: Holding = {
      ticker,
      companyName,
      assetClass,
      sector,
      geography,
      quantity: qty,
      averageCost,
      currentPrice: cmp,
      marketValue,
      portfolioWeight: 0, // computed in a second pass once totals are known
      coreSatellite,
      benchmark,
      status,
      unrealizedPnL,
      returnPct,
      costBasis,
      currency,
      // *Base values get filled below once we know the portfolio's base currency.
      marketValueBase: marketValue,
      costBasisBase: costBasis,
      unrealizedPnLBase: unrealizedPnL,
      extra: Object.keys(extra).length ? extra : undefined,
    };
    holdings.push(h);
  });

  // Decide the portfolio's base currency from the holdings we've parsed.
  // Single-currency files keep their native currency; mixed files default
  // to whichever currency dominates by USD-normalized market value.
  const baseCurrency = determineBaseCurrency(
    holdings.map((h) => ({ currency: h.currency || "USD", marketValue: h.marketValue })),
  );

  // FX-normalize the aggregation fields onto every holding.
  for (const h of holdings) {
    const from = h.currency || "USD";
    h.marketValueBase = fxConvert(h.marketValue, from, baseCurrency);
    h.costBasisBase = fxConvert(h.costBasis, from, baseCurrency);
    h.unrealizedPnLBase = fxConvert(h.unrealizedPnL, from, baseCurrency);
  }

  // Total value (in base currency) excludes Exited holdings.
  const totalValue = holdings
    .filter((h) => h.status !== "Exited")
    .reduce((s, h) => s + (h.marketValueBase ?? 0), 0);

  // Second pass: portfolioWeight using provided value where present, else
  // computed from FX-normalized values (so a 1% INR holding shows the same
  // weight whether the dashboard is in INR or USD).
  const providedWeights = raw.rows.map((row) => toNumber(row[map.portfolioWeight] as unknown));
  let weightFromProvided = false;
  holdings.forEach((h, i) => {
    const p = providedWeights[i];
    if (p != null) {
      // If the provided value is on 0..100 scale, convert to 0..1.
      h.portfolioWeight = p > 1 ? p / 100 : p;
      weightFromProvided = true;
    } else if (totalValue > 0 && h.status !== "Exited") {
      h.portfolioWeight = (h.marketValueBase ?? h.marketValue) / totalValue;
    } else {
      h.portfolioWeight = 0;
    }
  });

  if (!weightFromProvided && totalValue > 0) {
    warnings.push({
      field: "portfolioWeight",
      message: "Portfolio weight column not provided — weights computed as marketValue / total.",
    });
  }
  if (raw.rows.length > 0 && !("marketValue" in map)) {
    warnings.push({
      field: "marketValue",
      message: "Market value column not provided — values computed as quantity × currentPrice.",
    });
  }

  // Detect duplicate tickers (warn — first occurrence is kept by downstream consumers).
  const seen = new Map<string, number>();
  for (const h of holdings) {
    seen.set(h.ticker, (seen.get(h.ticker) || 0) + 1);
  }
  const dups = [...seen.entries()].filter(([, n]) => n > 1).map(([t]) => t);
  if (dups.length) {
    warnings.push({
      field: "ticker",
      message: `Duplicate ticker(s) detected: ${dups.join(", ")}. Each appears more than once in the file.`,
    });
  }

  return {
    fileName,
    holdings,
    errors,
    warnings,
    fieldMappings: trace,
    totalValue,
    baseCurrency,
    checksum: checksumOf(holdings),
    rawRowCount: raw.rows.length,
  };
}

// ---------------------------------------------------------------------------
// Sample CSV. Surfaced both as an in-app preview and as a download.
// ---------------------------------------------------------------------------

export const SAMPLE_CSV = `ticker,companyName,assetClass,sector,geography,quantity,averageCost,currentPrice,marketValue,portfolioWeight,coreSatellite,benchmark,status
AAPL,Apple Inc.,Equity,Technology,US,500,148.20,218.60,109300,8.5,Core,S&P 500,Current
MSFT,Microsoft Corp.,Equity,Technology,US,400,305.50,421.30,168520,13.2,Core,S&P 500,Current
NVDA,NVIDIA Corp.,Equity,Technology,US,200,412.60,1124.20,224840,17.6,Satellite,S&P 500,Current
JPM,JPMorgan Chase,Equity,Financials,US,300,158.70,218.40,65520,5.1,Core,S&P 500,Current
LLY,Eli Lilly & Co.,Equity,Healthcare,US,80,718.00,824.50,65960,5.2,Satellite,S&P 500,Current
RELIANCE,Reliance Industries,Equity,Energy,India,2500,2380,2912,7280000,8.0,Core,NIFTY 50,Current
TCS,Tata Consultancy Services,Equity,Technology,India,1500,3624,4148,6222000,6.8,Core,NIFTY 50,Current
HDFCBANK,HDFC Bank,Equity,Financials,India,3000,1580,1684,5052000,5.5,Core,NIFTY 50,Current
INFY,Infosys Ltd.,Equity,Technology,India,2000,1462,1842,3684000,4.0,Satellite,NIFTY 50,Current
SPY,SPDR S&P 500 ETF,ETF,Diversified,US,400,470.40,552.80,221120,17.3,Core,S&P 500,Current
ZOMATO,Zomato Ltd.,Equity,Consumer Discretionary,India,5000,80.00,142.00,710000,0.8,Satellite,NIFTY 50,Watchlist
PAYTM,One97 Communications,Equity,Financials,India,1000,520.00,420.00,420000,0.5,Satellite,NIFTY 50,Exited
`;

// Used by the UI to render a clean "what your file should look like" preview.
export const SAMPLE_PREVIEW_ROWS: Array<Record<string, string>> = [
  {
    ticker: "AAPL",
    companyName: "Apple Inc.",
    assetClass: "Equity",
    sector: "Technology",
    geography: "US",
    quantity: "500",
    averageCost: "148.20",
    currentPrice: "218.60",
    marketValue: "109300",
    portfolioWeight: "8.5",
    coreSatellite: "Core",
    benchmark: "S&P 500",
    status: "Current",
  },
  {
    ticker: "RELIANCE",
    companyName: "Reliance Industries",
    assetClass: "Equity",
    sector: "Energy",
    geography: "India",
    quantity: "2500",
    averageCost: "2380",
    currentPrice: "2912",
    marketValue: "7280000",
    portfolioWeight: "8.0",
    coreSatellite: "Core",
    benchmark: "NIFTY 50",
    status: "Current",
  },
  {
    ticker: "PAYTM",
    companyName: "One97 Communications",
    assetClass: "Equity",
    sector: "Financials",
    geography: "India",
    quantity: "1000",
    averageCost: "520.00",
    currentPrice: "420.00",
    marketValue: "420000",
    portfolioWeight: "0.5",
    coreSatellite: "Satellite",
    benchmark: "NIFTY 50",
    status: "Exited",
  },
];

export { REQUIRED_PER_ROW, REQUIRED_FIELDS_FOR_VALIDATION, COLUMN_ALIASES };
