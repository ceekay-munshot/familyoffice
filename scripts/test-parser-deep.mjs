import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";

const file = "/Users/chiraagkapil/Downloads/portfolio_analysis_a840cb8c (1).xlsx";
const wb = XLSX.read(readFileSync(file), { type: "buffer" });
const ws = wb.Sheets[wb.SheetNames[0]];

const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
console.log("LLOMET row (full):");
const lloMet = rows.find((r) => String(r["Ticker"]).trim() === "LLOMET");
console.log(JSON.stringify(lloMet, null, 2));

console.log("\nFull row 3 (TATA STEEL) for comparison:");
const tatSte = rows.find((r) => String(r["Ticker"]).trim() === "TATSTE");
console.log(JSON.stringify(tatSte, null, 2));

console.log("\nAll Avg Cost vs CMP:");
rows.forEach((r) => {
  console.log(`  ${r["Ticker"]}: Avg Cost=${JSON.stringify(r["Avg Cost"])}, CMP=${JSON.stringify(r["CMP"])}`);
});
