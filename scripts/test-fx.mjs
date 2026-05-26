// Sanity-check the FX layer against the in-app sample CSV.
// Replicates the parser's flow inline so we can verify base-currency
// selection and total-value math without bundling the TS code.

const RATES_USD = { USD: 1, INR: 1 / 83.5, EUR: 1.08, GBP: 1.27 };
const rate = (c) => RATES_USD[c] ?? 1;
const fxConvert = (a, from, to) => (from === to ? a : (a * rate(from)) / rate(to));
const currencyForGeography = (g) => ({ US: "USD", India: "INR" })[g] ?? "USD";

const holdings = [
  { ticker: "AAPL", geo: "US", mv: 109300 },
  { ticker: "MSFT", geo: "US", mv: 168520 },
  { ticker: "NVDA", geo: "US", mv: 224840 },
  { ticker: "JPM", geo: "US", mv: 65520 },
  { ticker: "LLY", geo: "US", mv: 65960 },
  { ticker: "RELIANCE", geo: "India", mv: 7280000 },
  { ticker: "TCS", geo: "India", mv: 6222000 },
  { ticker: "HDFCBANK", geo: "India", mv: 5052000 },
  { ticker: "INFY", geo: "India", mv: 3684000 },
  { ticker: "SPY", geo: "US", mv: 221120 },
  { ticker: "ZOMATO", geo: "India", mv: 710000 },
  // PAYTM is Exited — skipped
];

const enriched = holdings.map((h) => ({
  ...h,
  currency: currencyForGeography(h.geo),
}));

// Determine dominant currency by USD-normalized MV
const usdTotals = {};
for (const h of enriched) {
  const usd = h.mv * rate(h.currency);
  usdTotals[h.currency] = (usdTotals[h.currency] || 0) + usd;
}
console.log("USD-normalized totals by currency:");
for (const [c, v] of Object.entries(usdTotals)) {
  console.log(`  ${c}: $${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
}

let base = "USD";
let max = -Infinity;
for (const [c, v] of Object.entries(usdTotals)) {
  if (v > max) {
    max = v;
    base = c;
  }
}
console.log(`\nBase currency selected: ${base}`);

const totalInBase = enriched.reduce((s, h) => s + fxConvert(h.mv, h.currency, base), 0);
const fmt = base === "INR"
  ? `₹${totalInBase.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
  : `$${totalInBase.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
console.log(`Total value (in ${base}): ${fmt}`);

// What the dashboard USED to show (the bug): raw sum, just slapped with $
const rawSum = enriched.reduce((s, h) => s + h.mv, 0);
console.log(`\nBefore FX layer (bug): $${rawSum.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);

// Also produce the equivalent in the *other* base for reference
const altBase = base === "USD" ? "INR" : "USD";
const totalInAlt = enriched.reduce((s, h) => s + fxConvert(h.mv, h.currency, altBase), 0);
const altFmt = altBase === "INR"
  ? `₹${totalInAlt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
  : `$${totalInAlt.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
console.log(`Equivalent in ${altBase}: ${altFmt}`);
