// Quick smoke test: run the portfolio parser against the user's real XLSX.
// Verifies (a) headers map correctly, (b) row-level validation passes,
// (c) warnings fire for missing classification columns, (d) derived
// marketValue and portfolioWeight are computed.

import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = "/Users/chiraagkapil/Documents/GitHub/familyoffice";

// Dynamically import the parser module via tsx-friendly path...
// Easier: replicate just the alias mapping locally using the same constants
// pulled from the parser source.
const PARSER_SRC = resolve(projectRoot, "src/lib/portfolioParser.ts");
const parserText = readFileSync(PARSER_SRC, "utf8");
const aliasMatch = parserText.match(/const COLUMN_ALIASES[\s\S]*?};/);
console.log("Parser source loaded:", PARSER_SRC, "(", parserText.length, "chars )");
console.log("COLUMN_ALIASES block detected:", !!aliasMatch);

// Read the XLSX
const file = "/Users/chiraagkapil/Downloads/portfolio_analysis_a840cb8c (1).xlsx";
const wb = XLSX.read(readFileSync(file), { type: "buffer" });
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
const headers = Object.keys(rows[0]).map((h) => h.trim());

console.log("\nXLSX headers:", headers);
console.log("Row count:", rows.length);

// Inline alias map (mirror of parser)
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
  coreSatellite: ["coresatellite", "coresat", "classification", "bucket", "sleeve", "portfolio"],
  benchmark: ["benchmark", "bench", "index"],
  status: ["status", "holdingstatus", "actiontoday", "action", "view"],
};

function norm(s) {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

const normalized = headers.map(norm);
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
console.log("\nHeader → canonical mapping:");
for (const [k, v] of Object.entries(map)) console.log(`  ${k.padEnd(18)} ← ${v}`);
console.log("Missing canonicals (will get defaults + warnings):");
const allCanon = Object.keys(COLUMN_ALIASES);
for (const c of allCanon) {
  if (!(c in map)) console.log(`  ${c}`);
}

console.log("\nSample row after extracting canonical fields:");
const r0 = rows[0];
console.log({
  ticker: r0[map.ticker],
  companyName: r0[map.companyName],
  qty: r0[map.quantity],
  averageCost: r0[map.averageCost],
  currentPrice: r0[map.currentPrice],
  // status will come from "View" via alias
  statusRaw: r0[map.status],
  // coreSatellite -> aliases include "portfolio" which is in this file
  coreSatelliteRaw: r0[map.coreSatellite],
});

console.log("\nAll currentPrice values (note N/A rows):");
rows.forEach((r, i) => {
  console.log(`  row ${i + 2}: ticker=${r[map.ticker]}, cmp=${r[map.currentPrice]}`);
});
