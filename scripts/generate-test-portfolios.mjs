// Generates three distinct test portfolios in ~/Downloads so the user
// can drag-drop them into the product. Each one exercises a different
// slice of the parser:
//
//  1. Singhania Family Office - Growth Tilt Q1 2026.xlsx
//     XLSX, 24 holdings, US + India, mixed Core/Satellite, all statuses,
//     full canonical schema.
//
//  2. Mehta Trust - Income & Stability.csv
//     CSV, 15 holdings, defensive sleeve. Demonstrates alternate column
//     aliases (Symbol, Company Name, Avg Price, LTP, Mkt Value, Wt %).
//
//  3. Aspire Capital - Tech Concentration.xlsx
//     XLSX, 11 holdings, concentrated US tech satellite play with
//     intentional overlaps to portfolio #1 so the diff lights up.

import * as XLSX from "xlsx";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const downloads = join(homedir(), "Downloads");

// Quantities are scaled by this factor so demo NAVs read like a real
// family-office book (mid- to upper-eight-figure USD, low thousands of
// crores INR) instead of a personal account.
const SCALE = 300;

function scale(rows, qtyKey, mvKey) {
  return rows.map((r) => {
    const cloned = { ...r };
    if (qtyKey in cloned) cloned[qtyKey] = (Number(cloned[qtyKey]) || 0) * SCALE;
    if (mvKey in cloned) cloned[mvKey] = (Number(cloned[mvKey]) || 0) * SCALE;
    return cloned;
  });
}

// ---------------------------------------------------------------------------
// Portfolio 1 — Singhania Family Office (canonical schema, US + India)
// ---------------------------------------------------------------------------

const SINGHANIA = [
  // US Core
  { ticker: "AAPL", companyName: "Apple Inc.", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 600, averageCost: 152.4, currentPrice: 218.6, marketValue: 131160, portfolioWeight: 6.2, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },
  { ticker: "MSFT", companyName: "Microsoft Corp.", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 450, averageCost: 312.8, currentPrice: 421.3, marketValue: 189585, portfolioWeight: 8.9, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },
  { ticker: "GOOGL", companyName: "Alphabet Inc.", assetClass: "Equity", sector: "Communication Services", geography: "US", quantity: 320, averageCost: 134.1, currentPrice: 174.8, marketValue: 55936, portfolioWeight: 2.6, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },
  { ticker: "AMZN", companyName: "Amazon.com Inc.", assetClass: "Equity", sector: "Consumer Discretionary", geography: "US", quantity: 380, averageCost: 142.3, currentPrice: 198.4, marketValue: 75392, portfolioWeight: 3.5, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },
  { ticker: "JPM", companyName: "JPMorgan Chase & Co.", assetClass: "Equity", sector: "Financials", geography: "US", quantity: 280, averageCost: 161.2, currentPrice: 218.4, marketValue: 61152, portfolioWeight: 2.9, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },
  { ticker: "JNJ", companyName: "Johnson & Johnson", assetClass: "Equity", sector: "Healthcare", geography: "US", quantity: 200, averageCost: 162.4, currentPrice: 158.2, marketValue: 31640, portfolioWeight: 1.5, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },
  { ticker: "PG", companyName: "Procter & Gamble", assetClass: "Equity", sector: "Consumer Staples", geography: "US", quantity: 180, averageCost: 144.6, currentPrice: 168.4, marketValue: 30312, portfolioWeight: 1.4, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },
  { ticker: "SPY", companyName: "SPDR S&P 500 ETF", assetClass: "ETF", sector: "Diversified", geography: "US", quantity: 320, averageCost: 472.6, currentPrice: 552.8, marketValue: 176896, portfolioWeight: 8.3, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },

  // US Satellite
  { ticker: "NVDA", companyName: "NVIDIA Corp.", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 220, averageCost: 418.4, currentPrice: 1124.2, marketValue: 247324, portfolioWeight: 11.6, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Current" },
  { ticker: "META", companyName: "Meta Platforms", assetClass: "Equity", sector: "Communication Services", geography: "US", quantity: 180, averageCost: 326.2, currentPrice: 568.1, marketValue: 102258, portfolioWeight: 4.8, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Current" },
  { ticker: "TSLA", companyName: "Tesla Inc.", assetClass: "Equity", sector: "Consumer Discretionary", geography: "US", quantity: 240, averageCost: 248.6, currentPrice: 218.4, marketValue: 52416, portfolioWeight: 2.5, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Watchlist" },
  { ticker: "LLY", companyName: "Eli Lilly & Co.", assetClass: "Equity", sector: "Healthcare", geography: "US", quantity: 100, averageCost: 718.4, currentPrice: 824.5, marketValue: 82450, portfolioWeight: 3.9, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Current" },
  { ticker: "PLTR", companyName: "Palantir Technologies", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 800, averageCost: 22.4, currentPrice: 38.6, marketValue: 30880, portfolioWeight: 1.5, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Current" },
  { ticker: "COIN", companyName: "Coinbase Global", assetClass: "Equity", sector: "Financials", geography: "US", quantity: 120, averageCost: 168.4, currentPrice: 232.1, marketValue: 27852, portfolioWeight: 1.3, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Watchlist" },

  // India Core
  { ticker: "RELIANCE", companyName: "Reliance Industries Ltd.", assetClass: "Equity", sector: "Energy", geography: "India", quantity: 2200, averageCost: 2380, currentPrice: 2912, marketValue: 6406400, portfolioWeight: 7.4, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "TCS", companyName: "Tata Consultancy Services", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 1100, averageCost: 3624, currentPrice: 4148, marketValue: 4562800, portfolioWeight: 5.3, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "HDFCBANK", companyName: "HDFC Bank Ltd.", assetClass: "Equity", sector: "Financials", geography: "India", quantity: 2600, averageCost: 1582, currentPrice: 1684, marketValue: 4378400, portfolioWeight: 5.1, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "BHARTIARTL", companyName: "Bharti Airtel Ltd.", assetClass: "Equity", sector: "Communication Services", geography: "India", quantity: 1800, averageCost: 1042, currentPrice: 1612, marketValue: 2901600, portfolioWeight: 3.4, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "INFY", companyName: "Infosys Ltd.", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 1400, averageCost: 1462, currentPrice: 1842, marketValue: 2578800, portfolioWeight: 3.0, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },

  // India Satellite
  { ticker: "TITAN", companyName: "Titan Company Ltd.", assetClass: "Equity", sector: "Consumer Discretionary", geography: "India", quantity: 600, averageCost: 3120, currentPrice: 3624, marketValue: 2174400, portfolioWeight: 2.5, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "DMART", companyName: "Avenue Supermarts (DMart)", assetClass: "Equity", sector: "Consumer Staples", geography: "India", quantity: 380, averageCost: 4180, currentPrice: 4612, marketValue: 1752560, portfolioWeight: 2.0, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "BAJFINANCE", companyName: "Bajaj Finance Ltd.", assetClass: "Equity", sector: "Financials", geography: "India", quantity: 280, averageCost: 6850, currentPrice: 7280, marketValue: 2038400, portfolioWeight: 2.4, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Watchlist" },
  { ticker: "PAYTM", companyName: "One97 Communications", assetClass: "Equity", sector: "Financials", geography: "India", quantity: 1200, averageCost: 580, currentPrice: 412, marketValue: 494400, portfolioWeight: 0.6, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Exited" },
  { ticker: "NIFTYBEES", companyName: "Nippon India Nifty BeES", assetClass: "ETF", sector: "Diversified", geography: "India", quantity: 32000, averageCost: 218, currentPrice: 256, marketValue: 8192000, portfolioWeight: 9.5, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
];

function writeXLSX(rows, headers, filename) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  // Reasonable column widths.
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Holdings");
  XLSX.writeFile(wb, filename);
  console.log("Wrote", filename);
}

function writeCSV(rows, headers, filename) {
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(","));
  }
  writeFileSync(filename, lines.join("\n"), "utf8");
  console.log("Wrote", filename);
}

const CANONICAL_HEADERS = [
  "ticker",
  "companyName",
  "assetClass",
  "sector",
  "geography",
  "quantity",
  "averageCost",
  "currentPrice",
  "marketValue",
  "portfolioWeight",
  "coreSatellite",
  "benchmark",
  "status",
];

writeXLSX(
  scale(SINGHANIA, "quantity", "marketValue"),
  CANONICAL_HEADERS,
  join(downloads, "Singhania Family Office - Growth Tilt Q1 2026.xlsx"),
);

// ---------------------------------------------------------------------------
// Portfolio 2 — Mehta Trust (defensive). CSV with alternate column names
// to exercise the alias mapper. Uses Symbol, Company Name, Avg Price, LTP,
// Mkt Value, Wt % — all of which should be picked up automatically.
// ---------------------------------------------------------------------------

const MEHTA = [
  { Symbol: "BRK.B", "Company Name": "Berkshire Hathaway B", "Asset Class": "Equity", Sector: "Financials", Geography: "US", Qty: 380, "Avg Price": 362.4, LTP: 462.1, "Mkt Value": 175598, "Wt %": 12.4, Classification: "Core", Benchmark: "S&P 500", Status: "Current" },
  { Symbol: "JNJ", "Company Name": "Johnson & Johnson", "Asset Class": "Equity", Sector: "Healthcare", Geography: "US", Qty: 420, "Avg Price": 162.8, LTP: 158.2, "Mkt Value": 66444, "Wt %": 4.7, Classification: "Core", Benchmark: "S&P 500", Status: "Current" },
  { Symbol: "KO", "Company Name": "Coca-Cola Company", "Asset Class": "Equity", Sector: "Consumer Staples", Geography: "US", Qty: 520, "Avg Price": 56.2, LTP: 68.4, "Mkt Value": 35568, "Wt %": 2.5, Classification: "Core", Benchmark: "S&P 500", Status: "Current" },
  { Symbol: "PEP", "Company Name": "PepsiCo Inc.", "Asset Class": "Equity", Sector: "Consumer Staples", Geography: "US", Qty: 220, "Avg Price": 168.4, LTP: 152.6, "Mkt Value": 33572, "Wt %": 2.4, Classification: "Core", Benchmark: "S&P 500", Status: "Current" },
  { Symbol: "WMT", "Company Name": "Walmart Inc.", "Asset Class": "Equity", Sector: "Consumer Staples", Geography: "US", Qty: 480, "Avg Price": 48.2, LTP: 88.6, "Mkt Value": 42528, "Wt %": 3.0, Classification: "Core", Benchmark: "S&P 500", Status: "Current" },
  { Symbol: "VZ", "Company Name": "Verizon Communications", "Asset Class": "Equity", Sector: "Communication Services", Geography: "US", Qty: 800, "Avg Price": 42.6, LTP: 41.2, "Mkt Value": 32960, "Wt %": 2.3, Classification: "Core", Benchmark: "S&P 500", Status: "Watchlist" },
  { Symbol: "T", "Company Name": "AT&T Inc.", "Asset Class": "Equity", Sector: "Communication Services", Geography: "US", Qty: 1200, "Avg Price": 18.4, LTP: 22.1, "Mkt Value": 26520, "Wt %": 1.9, Classification: "Core", Benchmark: "S&P 500", Status: "Watchlist" },
  { Symbol: "VTI", "Company Name": "Vanguard Total Stock Market ETF", "Asset Class": "ETF", Sector: "Diversified", Geography: "US", Qty: 380, "Avg Price": 212.4, LTP: 268.4, "Mkt Value": 101992, "Wt %": 7.2, Classification: "Core", Benchmark: "S&P 500", Status: "Current" },
  { Symbol: "BND", "Company Name": "Vanguard Total Bond Market ETF", "Asset Class": "Bond", Sector: "Diversified", Geography: "US", Qty: 1800, "Avg Price": 78.4, LTP: 72.6, "Mkt Value": 130680, "Wt %": 9.2, Classification: "Core", Benchmark: "Bloomberg Agg", Status: "Current" },
  { Symbol: "GLD", "Company Name": "SPDR Gold Trust", "Asset Class": "Commodity", Sector: "Diversified", Geography: "Global", Qty: 320, "Avg Price": 178.2, LTP: 232.4, "Mkt Value": 74368, "Wt %": 5.3, Classification: "Satellite", Benchmark: "Gold Spot", Status: "Current" },
  { Symbol: "HDFCBANK", "Company Name": "HDFC Bank Ltd.", "Asset Class": "Equity", Sector: "Financials", Geography: "India", Qty: 1800, "Avg Price": 1542, LTP: 1684, "Mkt Value": 3031200, "Wt %": 3.3, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "ITC", "Company Name": "ITC Ltd.", "Asset Class": "Equity", Sector: "Consumer Staples", Geography: "India", Qty: 4200, "Avg Price": 412, LTP: 468, "Mkt Value": 1965600, "Wt %": 2.1, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "ASIANPAINT", "Company Name": "Asian Paints Ltd.", "Asset Class": "Equity", Sector: "Materials", Geography: "India", Qty: 800, "Avg Price": 2820, LTP: 2412, "Mkt Value": 1929600, "Wt %": 2.1, Classification: "Satellite", Benchmark: "NIFTY 50", Status: "Watchlist" },
  { Symbol: "NESTLEIND", "Company Name": "Nestle India Ltd.", "Asset Class": "Equity", Sector: "Consumer Staples", Geography: "India", Qty: 320, "Avg Price": 22400, LTP: 24650, "Mkt Value": 7888000, "Wt %": 8.6, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "SBIN", "Company Name": "State Bank of India", "Asset Class": "Equity", Sector: "Financials", Geography: "India", Qty: 0, "Avg Price": 542, LTP: 824, "Mkt Value": 0, "Wt %": 0, Classification: "Satellite", Benchmark: "NIFTY 50", Status: "Exited" },
];

const MEHTA_HEADERS = ["Symbol", "Company Name", "Asset Class", "Sector", "Geography", "Qty", "Avg Price", "LTP", "Mkt Value", "Wt %", "Classification", "Benchmark", "Status"];

writeCSV(scale(MEHTA, "Qty", "Mkt Value"), MEHTA_HEADERS, join(downloads, "Mehta Trust - Income & Stability.csv"));

// ---------------------------------------------------------------------------
// Portfolio 3 — Aspire Capital (concentrated tech). Overlaps with #1 on
// NVDA / AAPL / META so the diff against Singhania lights up clearly.
// ---------------------------------------------------------------------------

const ASPIRE = [
  { ticker: "NVDA", companyName: "NVIDIA Corp.", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 380, averageCost: 484.2, currentPrice: 1124.2, marketValue: 427196, portfolioWeight: 19.4, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Current" },
  { ticker: "AAPL", companyName: "Apple Inc.", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 420, averageCost: 158.6, currentPrice: 218.6, marketValue: 91812, portfolioWeight: 4.2, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },
  { ticker: "MSFT", companyName: "Microsoft Corp.", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 280, averageCost: 318.4, currentPrice: 421.3, marketValue: 117964, portfolioWeight: 5.4, coreSatellite: "Core", benchmark: "S&P 500", status: "Current" },
  { ticker: "AMD", companyName: "Advanced Micro Devices", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 520, averageCost: 108.2, currentPrice: 168.4, marketValue: 87568, portfolioWeight: 4.0, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Current" },
  { ticker: "AVGO", companyName: "Broadcom Inc.", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 180, averageCost: 824.6, currentPrice: 1642.8, marketValue: 295704, portfolioWeight: 13.4, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Current" },
  { ticker: "META", companyName: "Meta Platforms", assetClass: "Equity", sector: "Communication Services", geography: "US", quantity: 240, averageCost: 318.4, currentPrice: 568.1, marketValue: 136344, portfolioWeight: 6.2, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Current" },
  { ticker: "ADBE", companyName: "Adobe Inc.", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 220, averageCost: 528.4, currentPrice: 482.6, marketValue: 106172, portfolioWeight: 4.8, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Watchlist" },
  { ticker: "CRM", companyName: "Salesforce Inc.", assetClass: "Equity", sector: "Technology", geography: "US", quantity: 320, averageCost: 218.4, currentPrice: 312.6, marketValue: 100032, portfolioWeight: 4.5, coreSatellite: "Satellite", benchmark: "S&P 500", status: "Current" },
  { ticker: "QQQ", companyName: "Invesco QQQ Trust", assetClass: "ETF", sector: "Diversified", geography: "US", quantity: 480, averageCost: 412.6, currentPrice: 492.4, marketValue: 236352, portfolioWeight: 10.7, coreSatellite: "Core", benchmark: "Nasdaq 100", status: "Current" },
  { ticker: "SMH", companyName: "VanEck Semiconductor ETF", assetClass: "ETF", sector: "Technology", geography: "US", quantity: 380, averageCost: 198.4, currentPrice: 268.2, marketValue: 101916, portfolioWeight: 4.6, coreSatellite: "Satellite", benchmark: "PHLX Semi", status: "Current" },
  { ticker: "ARKK", companyName: "ARK Innovation ETF", assetClass: "ETF", sector: "Technology", geography: "US", quantity: 0, averageCost: 68.4, currentPrice: 52.2, marketValue: 0, portfolioWeight: 0, coreSatellite: "Satellite", benchmark: "Nasdaq 100", status: "Exited" },
];

writeXLSX(
  scale(ASPIRE, "quantity", "marketValue"),
  CANONICAL_HEADERS,
  join(downloads, "Aspire Capital - Tech Concentration.xlsx"),
);

console.log("\nAll done. Files placed in:", downloads);
