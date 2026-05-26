// Full end-to-end parse simulation against the actual user file.
// Mirrors the production parser logic exactly so we can verify
// every output field before the user clicks "Upload".

import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";

const FILE = "/Users/chiraagkapil/Downloads/portfolio_analysis_a840cb8c (1).xlsx";

// --- Mirror of portfolioParser.ts ---

const COLUMN_ALIASES = {
  ticker: ["ticker", "symbol", "scrip", "code", "tickersymbol"],
  companyName: ["companyname", "company", "name", "security", "securityname", "instrument", "stock"],
  assetClass: ["assetclass", "type", "instrumenttype", "category"],
  sector: ["sector", "industry", "gics", "gicssector"],
  geography: ["geography", "geo", "country", "region", "market"],
  quantity: ["quantity", "qty", "shares", "units", "holdings", "position"],
  averageCost: ["averagecost", "avgcost", "avgprice", "averageprice", "cost", "costprice", "buyprice"],
  currentPrice: ["currentprice", "cmp", "ltp", "lasttradedprice", "price", "marketprice", "mktprice", "currentmarketprice"],
  marketValue: ["marketvalue", "mv", "value", "currentvalue", "positionvalue"],
  portfolioWeight: ["portfolioweight", "weight", "weightpct", "weightpercent", "wt", "allocation"],
  coreSatellite: ["coresatellite", "coresat", "classification", "bucket", "sleeve"],
  benchmark: ["benchmark", "bench", "index"],
  status: ["status", "holdingstatus", "actiontoday", "action"],
};

const REQUIRED_PER_ROW = ["ticker", "companyName", "quantity", "currentPrice"];

function norm(s) {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function toCleanString(v) {
  return v == null ? "" : String(v).trim();
}
function toNumber(v) {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "n/a" || s.toLowerCase() === "na" || s === "-") return null;
  const cleaned = s.replace(/[,₹$€£\s%]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
function normalizeStatus(raw) {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith("curr") || s === "hold" || s === "active" || s === "holding") return "Current";
  if (s.startsWith("exit") || s === "sold" || s === "closed" || s === "sell") return "Exited";
  if (s.startsWith("watch") || s === "monitor" || s === "tracking") return "Watchlist";
  if (s === "buy" || s === "add on weakness" || s === "addonweakness" || s === "trim") return "Current";
  return null;
}
function normalizeCoreSatellite(raw) {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith("core")) return "Core";
  if (s.startsWith("sat")) return "Satellite";
  return null;
}
function inferGeography(ticker) {
  const t = ticker.toUpperCase();
  if (/\.NS$|\.BO$/.test(t)) return "India";
  if (t.length >= 5 && t.length <= 6 && /^[A-Z]+$/.test(t) && !/^[A-Z]{1,4}$/.test(t)) return "India";
  return "Unknown";
}

// --- Read XLSX ---
const wb = XLSX.read(readFileSync(FILE), { type: "buffer" });
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
const headers = Object.keys(rows[0]).map((h) => h.trim());
const normalized = headers.map(norm);

// --- Build header map ---
const map = {};
for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx >= 0) {
      map[canonical] = headers[idx];
      break;
    }
  }
}
const missingColumns = Object.keys(COLUMN_ALIASES).filter((k) => !(k in map));
console.log("=== HEADER MAPPING ===");
for (const [k, v] of Object.entries(map)) console.log(`  ${k.padEnd(18)} ← ${v}`);
console.log("\nMissing canonical columns:", missingColumns.join(", "));

// --- Per-row processing ---
const errors = [];
const holdings = [];
rows.forEach((row, idx) => {
  const rowNum = idx + 2;
  const get = (c) => (map[c] ? row[map[c]] : undefined);

  const ticker = toCleanString(get("ticker")).toUpperCase();
  const companyName = toCleanString(get("companyName"));
  const quantity = toNumber(get("quantity"));
  const currentPrice = toNumber(get("currentPrice"));

  const rowErrors = [];
  if (!ticker) rowErrors.push({ row: rowNum, field: "ticker", message: "Ticker is required." });
  if (!companyName) rowErrors.push({ row: rowNum, field: "companyName", message: "Company name is required." });
  if (quantity == null || quantity < 0) rowErrors.push({ row: rowNum, field: "quantity", message: "Quantity must be a non-negative number." });
  if (currentPrice == null || currentPrice < 0) rowErrors.push({ row: rowNum, field: "currentPrice", message: "Current price must be a non-negative number." });
  if (rowErrors.length) {
    errors.push(...rowErrors);
    return;
  }

  const avgCost = toNumber(get("averageCost")) ?? currentPrice;
  const mv = toNumber(get("marketValue")) ?? quantity * currentPrice;
  const sector = toCleanString(get("sector")) || "Unclassified";
  const geography = toCleanString(get("geography")) || inferGeography(ticker);
  const coreSatellite = normalizeCoreSatellite(toCleanString(get("coreSatellite"))) ?? "Core";
  const status = normalizeStatus(toCleanString(get("status"))) ?? "Current";

  holdings.push({
    ticker,
    companyName,
    quantity,
    averageCost: avgCost,
    currentPrice,
    marketValue: mv,
    sector,
    geography,
    coreSatellite,
    status,
    statusSource: toCleanString(get("status")),
  });
});

const totalValue = holdings.filter((h) => h.status !== "Exited").reduce((s, h) => s + h.marketValue, 0);
holdings.forEach((h) => {
  h.portfolioWeight = h.status !== "Exited" && totalValue > 0 ? h.marketValue / totalValue : 0;
});

console.log("\n=== ROW-BY-ROW RESULTS ===");
holdings.forEach((h) => {
  console.log(
    `  ${h.ticker.padEnd(8)} qty=${String(h.quantity).padStart(6)} ` +
      `avg=₹${String(h.averageCost.toFixed(2)).padStart(9)} ` +
      `cmp=₹${String(h.currentPrice.toFixed(2)).padStart(9)} ` +
      `mv=₹${String(h.marketValue.toLocaleString("en-IN")).padStart(14)} ` +
      `wt=${(h.portfolioWeight * 100).toFixed(2).padStart(5)}% ` +
      `status=${h.status.padEnd(10)} (raw='${h.statusSource}') ` +
      `sleeve=${h.coreSatellite} geo=${h.geography}`,
  );
});

console.log("\n=== SUMMARY ===");
console.log(`Total rows in file: ${rows.length}`);
console.log(`Valid holdings: ${holdings.length}`);
console.log(`Row-level errors: ${errors.length}`);
console.log(`Status: Current=${holdings.filter((h) => h.status === "Current").length}, Watchlist=${holdings.filter((h) => h.status === "Watchlist").length}, Exited=${holdings.filter((h) => h.status === "Exited").length}`);
console.log(`Total portfolio value (excl. Exited): ₹${totalValue.toLocaleString("en-IN")}`);
console.log(`Inferred geography: ${[...new Set(holdings.map((h) => h.geography))].join(", ")}`);
console.log(`Expected warnings:`);
for (const c of missingColumns) console.log(`  - ${c}: ${c === "marketValue" || c === "portfolioWeight" ? "auto-calculated" : "default applied"}`);

if (errors.length) {
  console.log("\nROW ERRORS:");
  errors.forEach((e) => console.log(`  row ${e.row} · ${e.field}: ${e.message}`));
}
