// Generates three distinct India-only test portfolios in ~/Downloads so
// the user can drag-drop them into the product. Each one exercises a
// different slice of the parser:
//
//  1. Singhania Family Office - Growth Tilt Q1 2026.xlsx
//     XLSX, ~22 holdings, Indian listed + unlisted, mixed Core/Satellite,
//     all statuses, full canonical schema.
//
//  2. Mehta Trust - Income & Stability.csv
//     CSV, ~15 holdings, defensive Indian sleeve. Demonstrates alternate
//     column aliases (Symbol, Company Name, Avg Price, LTP, Mkt Value, Wt %).
//
//  3. Aspire Capital - Tech Concentration.xlsx
//     XLSX, ~12 holdings, concentrated Indian tech + unlisted fintech
//     play with intentional overlaps to portfolio #1 so the diff lights up.

import * as XLSX from "xlsx";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const downloads = join(homedir(), "Downloads");

// Family-office scaling factor. Per-row quantities are kept human-readable
// and multiplied at write-time.
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
// Portfolio 1 — Singhania Family Office (growth tilt across NIFTY large-caps
// plus four unlisted private bets — pre-IPO fintech, ed-tech, and consumer).
// ---------------------------------------------------------------------------

const SINGHANIA = [
  // Listed — Core
  { ticker: "RELIANCE", companyName: "Reliance Industries Ltd.", assetClass: "Equity", sector: "Energy", geography: "India", quantity: 2500, averageCost: 2380, currentPrice: 2912, marketValue: 7280000, portfolioWeight: 9.4, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "TCS", companyName: "Tata Consultancy Services", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 1400, averageCost: 3624, currentPrice: 4148, marketValue: 5807200, portfolioWeight: 7.5, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "HDFCBANK", companyName: "HDFC Bank Ltd.", assetClass: "Equity", sector: "Financials", geography: "India", quantity: 3200, averageCost: 1580, currentPrice: 1684, marketValue: 5388800, portfolioWeight: 7.0, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "ICICIBANK", companyName: "ICICI Bank Ltd.", assetClass: "Equity", sector: "Financials", geography: "India", quantity: 3000, averageCost: 980, currentPrice: 1124, marketValue: 3372000, portfolioWeight: 4.4, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "INFY", companyName: "Infosys Ltd.", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 2200, averageCost: 1462, currentPrice: 1842, marketValue: 4052400, portfolioWeight: 5.2, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "BHARTIARTL", companyName: "Bharti Airtel Ltd.", assetClass: "Equity", sector: "Communication Services", geography: "India", quantity: 1800, averageCost: 1042, currentPrice: 1612, marketValue: 2901600, portfolioWeight: 3.8, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "ITC", companyName: "ITC Ltd.", assetClass: "Equity", sector: "Consumer Staples", geography: "India", quantity: 4000, averageCost: 412, currentPrice: 468, marketValue: 1872000, portfolioWeight: 2.4, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "LT", companyName: "Larsen & Toubro Ltd.", assetClass: "Equity", sector: "Industrials", geography: "India", quantity: 900, averageCost: 3140, currentPrice: 3582, marketValue: 3223800, portfolioWeight: 4.2, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "NIFTYBEES", companyName: "Nippon India Nifty BeES", assetClass: "ETF", sector: "Diversified", geography: "India", quantity: 15000, averageCost: 218, currentPrice: 256, marketValue: 3840000, portfolioWeight: 5.0, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },

  // Listed — Satellite
  { ticker: "TITAN", companyName: "Titan Company Ltd.", assetClass: "Equity", sector: "Consumer Discretionary", geography: "India", quantity: 800, averageCost: 3120, currentPrice: 3624, marketValue: 2899200, portfolioWeight: 3.8, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "MARUTI", companyName: "Maruti Suzuki India Ltd.", assetClass: "Equity", sector: "Consumer Discretionary", geography: "India", quantity: 280, averageCost: 9800, currentPrice: 11250, marketValue: 3150000, portfolioWeight: 4.1, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "SUNPHARMA", companyName: "Sun Pharmaceutical Industries", assetClass: "Equity", sector: "Healthcare", geography: "India", quantity: 1200, averageCost: 1420, currentPrice: 1718, marketValue: 2061600, portfolioWeight: 2.7, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "DMART", companyName: "Avenue Supermarts (DMart)", assetClass: "Equity", sector: "Consumer Staples", geography: "India", quantity: 400, averageCost: 4180, currentPrice: 4612, marketValue: 1844800, portfolioWeight: 2.4, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "ADANIENT", companyName: "Adani Enterprises Ltd.", assetClass: "Equity", sector: "Industrials", geography: "India", quantity: 350, averageCost: 2240, currentPrice: 2780, marketValue: 973000, portfolioWeight: 1.3, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Watchlist" },
  { ticker: "ASIANPAINT", companyName: "Asian Paints Ltd.", assetClass: "Equity", sector: "Materials", geography: "India", quantity: 700, averageCost: 2820, currentPrice: 2412, marketValue: 1688400, portfolioWeight: 2.2, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Watchlist" },
  { ticker: "ZOMATO", companyName: "Zomato Ltd.", assetClass: "Equity", sector: "Consumer Discretionary", geography: "India", quantity: 6000, averageCost: 80, currentPrice: 142, marketValue: 852000, portfolioWeight: 1.1, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "BAJFINANCE", companyName: "Bajaj Finance Ltd.", assetClass: "Equity", sector: "Financials", geography: "India", quantity: 300, averageCost: 6850, currentPrice: 7280, marketValue: 2184000, portfolioWeight: 0, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Exited" },

  // Unlisted — Satellite
  { ticker: "RAZORPAY", companyName: "Razorpay Software Pvt. Ltd.", assetClass: "Alternative", sector: "Financials", geography: "India", quantity: 2000, averageCost: 1800, currentPrice: 2200, marketValue: 4400000, portfolioWeight: 5.7, coreSatellite: "Satellite", benchmark: "Private Markets", status: "Current" },
  { ticker: "ZERODHA", companyName: "Zerodha Broking Pvt. Ltd.", assetClass: "Alternative", sector: "Financials", geography: "India", quantity: 300, averageCost: 12000, currentPrice: 15000, marketValue: 4500000, portfolioWeight: 5.8, coreSatellite: "Satellite", benchmark: "Private Markets", status: "Current" },
  { ticker: "LENSKART", companyName: "Lenskart Solutions Pvt. Ltd.", assetClass: "Alternative", sector: "Consumer Discretionary", geography: "India", quantity: 1200, averageCost: 1500, currentPrice: 1800, marketValue: 2160000, portfolioWeight: 2.8, coreSatellite: "Satellite", benchmark: "Private Markets", status: "Current" },
  { ticker: "DREAMSPORTS", companyName: "Sporta Technologies (Dream11)", assetClass: "Alternative", sector: "Communication Services", geography: "India", quantity: 400, averageCost: 3000, currentPrice: 3500, marketValue: 1400000, portfolioWeight: 1.8, coreSatellite: "Satellite", benchmark: "Private Markets", status: "Current" },
  { ticker: "OYO", companyName: "Oravel Stays Ltd. (OYO)", assetClass: "Alternative", sector: "Consumer Discretionary", geography: "India", quantity: 5000, averageCost: 480, currentPrice: 600, marketValue: 3000000, portfolioWeight: 3.9, coreSatellite: "Satellite", benchmark: "Private Markets", status: "Watchlist" },
];

function writeXLSX(rows, headers, filename) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
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
// Portfolio 2 — Mehta Trust (defensive Indian sleeve). CSV with alternate
// column names to exercise the alias mapper. Uses Symbol, Company Name,
// Avg Price, LTP, Mkt Value, Wt % — all of which should be picked up
// automatically.
// ---------------------------------------------------------------------------

const MEHTA = [
  { Symbol: "HDFCBANK", "Company Name": "HDFC Bank Ltd.", "Asset Class": "Equity", Sector: "Financials", Geography: "India", Qty: 4500, "Avg Price": 1542, LTP: 1684, "Mkt Value": 7578000, "Wt %": 14.2, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "ITC", "Company Name": "ITC Ltd.", "Asset Class": "Equity", Sector: "Consumer Staples", Geography: "India", Qty: 8000, "Avg Price": 412, LTP: 468, "Mkt Value": 3744000, "Wt %": 7.0, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "HINDUNILVR", "Company Name": "Hindustan Unilever Ltd.", "Asset Class": "Equity", Sector: "Consumer Staples", Geography: "India", Qty: 1600, "Avg Price": 2680, LTP: 2456, "Mkt Value": 3929600, "Wt %": 7.4, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "NESTLEIND", "Company Name": "Nestle India Ltd.", "Asset Class": "Equity", Sector: "Consumer Staples", Geography: "India", Qty: 280, "Avg Price": 22400, LTP: 24650, "Mkt Value": 6902000, "Wt %": 13.0, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "BHARTIARTL", "Company Name": "Bharti Airtel Ltd.", "Asset Class": "Equity", Sector: "Communication Services", Geography: "India", Qty: 2400, "Avg Price": 1042, LTP: 1612, "Mkt Value": 3868800, "Wt %": 7.3, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "SUNPHARMA", "Company Name": "Sun Pharmaceutical Industries", "Asset Class": "Equity", Sector: "Healthcare", Geography: "India", Qty: 2000, "Avg Price": 1420, LTP: 1718, "Mkt Value": 3436000, "Wt %": 6.5, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "NIFTYBEES", "Company Name": "Nippon India Nifty BeES", "Asset Class": "ETF", Sector: "Diversified", Geography: "India", Qty: 20000, "Avg Price": 218, LTP: 256, "Mkt Value": 5120000, "Wt %": 9.6, Classification: "Core", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "BANKBEES", "Company Name": "Nippon India Bank BeES", "Asset Class": "ETF", Sector: "Financials", Geography: "India", Qty: 8000, "Avg Price": 480, LTP: 548, "Mkt Value": 4384000, "Wt %": 8.2, Classification: "Core", Benchmark: "NIFTY BANK", Status: "Current" },
  { Symbol: "GOLDBEES", "Company Name": "Nippon India Gold BeES", "Asset Class": "Commodity", Sector: "Diversified", Geography: "India", Qty: 50000, "Avg Price": 52, LTP: 68, "Mkt Value": 3400000, "Wt %": 6.4, Classification: "Core", Benchmark: "Gold Spot", Status: "Current" },
  { Symbol: "LIQUIDBEES", "Company Name": "Nippon India Liquid BeES", "Asset Class": "Bond", Sector: "Diversified", Geography: "India", Qty: 4000, "Avg Price": 1000, LTP: 1000, "Mkt Value": 4000000, "Wt %": 7.5, Classification: "Core", Benchmark: "T-Bills", Status: "Current" },
  { Symbol: "TCS", "Company Name": "Tata Consultancy Services", "Asset Class": "Equity", Sector: "Technology", Geography: "India", Qty: 600, "Avg Price": 3624, LTP: 4148, "Mkt Value": 2488800, "Wt %": 4.7, Classification: "Satellite", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "TITAN", "Company Name": "Titan Company Ltd.", "Asset Class": "Equity", Sector: "Consumer Discretionary", Geography: "India", Qty: 400, "Avg Price": 3120, LTP: 3624, "Mkt Value": 1449600, "Wt %": 2.7, Classification: "Satellite", Benchmark: "NIFTY 50", Status: "Current" },
  { Symbol: "ASIANPAINT", "Company Name": "Asian Paints Ltd.", "Asset Class": "Equity", Sector: "Materials", Geography: "India", Qty: 500, "Avg Price": 2820, LTP: 2412, "Mkt Value": 1206000, "Wt %": 2.3, Classification: "Satellite", Benchmark: "NIFTY 50", Status: "Watchlist" },
  { Symbol: "ZERODHA", "Company Name": "Zerodha Broking Pvt. Ltd.", "Asset Class": "Alternative", Sector: "Financials", Geography: "India", Qty: 200, "Avg Price": 12000, LTP: 15000, "Mkt Value": 3000000, "Wt %": 5.6, Classification: "Satellite", Benchmark: "Private Markets", Status: "Current" },
  { Symbol: "BAJFINANCE", "Company Name": "Bajaj Finance Ltd.", "Asset Class": "Equity", Sector: "Financials", Geography: "India", Qty: 0, "Avg Price": 7400, LTP: 7280, "Mkt Value": 0, "Wt %": 0, Classification: "Satellite", Benchmark: "NIFTY 50", Status: "Exited" },
];

const MEHTA_HEADERS = ["Symbol", "Company Name", "Asset Class", "Sector", "Geography", "Qty", "Avg Price", "LTP", "Mkt Value", "Wt %", "Classification", "Benchmark", "Status"];

writeCSV(scale(MEHTA, "Qty", "Mkt Value"), MEHTA_HEADERS, join(downloads, "Mehta Trust - Income & Stability.csv"));

// ---------------------------------------------------------------------------
// Portfolio 3 — Aspire Capital (concentrated Indian tech + unlisted fintech).
// Overlaps Singhania on TCS / INFY / RAZORPAY / ZERODHA for diff testing.
// ---------------------------------------------------------------------------

const ASPIRE = [
  { ticker: "INFY", companyName: "Infosys Ltd.", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 3500, averageCost: 1480, currentPrice: 1842, marketValue: 6447000, portfolioWeight: 18.4, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "TCS", companyName: "Tata Consultancy Services", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 1200, averageCost: 3624, currentPrice: 4148, marketValue: 4977600, portfolioWeight: 14.2, coreSatellite: "Core", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "WIPRO", companyName: "Wipro Ltd.", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 8000, averageCost: 380, currentPrice: 442, marketValue: 3536000, portfolioWeight: 10.1, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "HCLTECH", companyName: "HCL Technologies Ltd.", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 2200, averageCost: 1480, currentPrice: 1612, marketValue: 3546400, portfolioWeight: 10.1, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "PERSISTENT", companyName: "Persistent Systems Ltd.", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 900, averageCost: 4280, currentPrice: 5180, marketValue: 4662000, portfolioWeight: 13.3, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "TECHM", companyName: "Tech Mahindra Ltd.", assetClass: "Equity", sector: "Technology", geography: "India", quantity: 1600, averageCost: 1240, currentPrice: 1382, marketValue: 2211200, portfolioWeight: 6.3, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Watchlist" },
  { ticker: "ZOMATO", companyName: "Zomato Ltd.", assetClass: "Equity", sector: "Consumer Discretionary", geography: "India", quantity: 12000, averageCost: 80, currentPrice: 142, marketValue: 1704000, portfolioWeight: 4.9, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Current" },
  { ticker: "PAYTM", companyName: "One97 Communications Ltd.", assetClass: "Equity", sector: "Financials", geography: "India", quantity: 0, averageCost: 580, currentPrice: 412, marketValue: 0, portfolioWeight: 0, coreSatellite: "Satellite", benchmark: "NIFTY 50", status: "Exited" },

  // Unlisted Indian tech / fintech
  { ticker: "RAZORPAY", companyName: "Razorpay Software Pvt. Ltd.", assetClass: "Alternative", sector: "Financials", geography: "India", quantity: 2500, averageCost: 1800, currentPrice: 2200, marketValue: 5500000, portfolioWeight: 15.7, coreSatellite: "Satellite", benchmark: "Private Markets", status: "Current" },
  { ticker: "ZERODHA", companyName: "Zerodha Broking Pvt. Ltd.", assetClass: "Alternative", sector: "Financials", geography: "India", quantity: 100, averageCost: 12000, currentPrice: 15000, marketValue: 1500000, portfolioWeight: 4.3, coreSatellite: "Satellite", benchmark: "Private Markets", status: "Current" },
  { ticker: "MEESHO", companyName: "Fashnear Technologies (Meesho)", assetClass: "Alternative", sector: "Consumer Discretionary", geography: "India", quantity: 3000, averageCost: 240, currentPrice: 280, marketValue: 840000, portfolioWeight: 2.4, coreSatellite: "Satellite", benchmark: "Private Markets", status: "Current" },
  { ticker: "PHARMEASY", companyName: "API Holdings (PharmEasy)", assetClass: "Alternative", sector: "Healthcare", geography: "India", quantity: 4000, averageCost: 60, currentPrice: 45, marketValue: 180000, portfolioWeight: 0.5, coreSatellite: "Satellite", benchmark: "Private Markets", status: "Watchlist" },
];

writeXLSX(
  scale(ASPIRE, "quantity", "marketValue"),
  CANONICAL_HEADERS,
  join(downloads, "Aspire Capital - Tech Concentration.xlsx"),
);

console.log("\nAll done. Files placed in:", downloads);
