// Runs the parser logic (mirror) against each generated test file
// to confirm zero row-errors and report what mapped to what.

import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const COLUMN_ALIASES = {
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

const REQUIRED = ["ticker", "companyName", "quantity", "currentPrice"];

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const cleanStr = (v) => (v == null ? "" : String(v).trim());
const num = (v) => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "n/a" || s === "-") return null;
  const c = s.replace(/[,₹$€£\s%]/g, "");
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
};

function readTable(file) {
  if (file.endsWith(".csv")) {
    const text = readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const parseCSVLine = (line) => {
      const out = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQ) {
          if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (c === '"') inQ = false;
          else cur += c;
        } else {
          if (c === ",") { out.push(cur); cur = ""; }
          else if (c === '"') inQ = true;
          else cur += c;
        }
      }
      out.push(cur);
      return out;
    };
    const headers = parseCSVLine(lines[0]).map((h) => h.trim());
    const rows = lines.slice(1).map((l) => {
      const cells = parseCSVLine(l);
      const obj = {};
      headers.forEach((h, i) => (obj[h] = cells[i] ?? ""));
      return obj;
    });
    return { headers, rows };
  } else {
    const wb = XLSX.read(readFileSync(file), { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
    const headers = Object.keys(rows[0]).map((h) => h.trim());
    return { headers, rows };
  }
}

function check(file) {
  console.log(`\n=== ${file.split("/").pop()} ===`);
  const { headers, rows } = readTable(file);
  const normalized = headers.map(norm);
  const map = {};
  for (const [c, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const a of aliases) {
      const i = normalized.indexOf(a);
      if (i >= 0) { map[c] = headers[i]; break; }
    }
  }
  console.log("Headers:", headers.length, "→ Mapped:", Object.keys(map).length);
  for (const [k, v] of Object.entries(map)) console.log(`  ${k.padEnd(18)} ← ${v}`);
  const missing = Object.keys(COLUMN_ALIASES).filter((k) => !(k in map));
  if (missing.length) console.log("  Missing:", missing.join(", "));

  let errors = 0;
  let valid = 0;
  const statuses = { Current: 0, Watchlist: 0, Exited: 0 };
  rows.forEach((r, i) => {
    const t = cleanStr(map.ticker ? r[map.ticker] : "");
    const c = cleanStr(map.companyName ? r[map.companyName] : "");
    const q = num(map.quantity ? r[map.quantity] : null);
    const p = num(map.currentPrice ? r[map.currentPrice] : null);
    if (!t || !c || q == null || q < 0 || p == null || p < 0) {
      errors++;
      console.log(`  row ${i + 2}: invalid (t=${t!=""} c=${c!=""} q=${q} p=${p})`);
    } else {
      valid++;
      const s = cleanStr(map.status ? r[map.status] : "");
      const sl = s.toLowerCase();
      if (sl.startsWith("exit") || sl === "sold" || sl === "closed") statuses.Exited++;
      else if (sl.startsWith("watch") || sl === "monitor") statuses.Watchlist++;
      else statuses.Current++;
    }
  });
  console.log(`Rows: ${rows.length} → ${valid} valid, ${errors} errors. Status: C=${statuses.Current} W=${statuses.Watchlist} X=${statuses.Exited}`);
}

const D = join(homedir(), "Downloads");
check(join(D, "Singhania Family Office - Growth Tilt Q1 2026.xlsx"));
check(join(D, "Mehta Trust - Income & Stability.csv"));
check(join(D, "Aspire Capital - Tech Concentration.xlsx"));
