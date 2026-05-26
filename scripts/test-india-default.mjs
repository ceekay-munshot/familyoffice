// Verify the India-first base-currency rule against three scenarios:
//   1. Pure US portfolio          → base USD
//   2. Pure India portfolio       → base INR
//   3. Mixed US + India portfolio → base INR (NOT USD)

const RATES_USD = { USD: 1, INR: 1 / 83.5, EUR: 1.08, GBP: 1.27 };
const rate = (c) => RATES_USD[c] ?? 1;
const fxConvert = (a, from, to) => (from === to ? a : (a * rate(from)) / rate(to));

function determineBase(holdings) {
  if (holdings.length === 0) return "INR";
  const distinct = new Set(holdings.map((h) => h.currency));
  if (distinct.size === 1 && [...distinct][0] === "USD") return "USD";
  return "INR";
}

function totalInBase(holdings, base) {
  return holdings.reduce((s, h) => s + fxConvert(h.mv, h.currency, base), 0);
}

function fmt(amount, code) {
  const locale = code === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(amount);
}

const scenarios = [
  {
    name: "Pure US (Aspire)",
    holdings: [
      { ticker: "NVDA", currency: "USD", mv: 427196 },
      { ticker: "AAPL", currency: "USD", mv: 91812 },
      { ticker: "AVGO", currency: "USD", mv: 295704 },
      { ticker: "QQQ", currency: "USD", mv: 236352 },
    ],
  },
  {
    name: "Pure India (user's original XLSX)",
    holdings: [
      { ticker: "TILIND", currency: "INR", mv: 2145000 },
      { ticker: "ULTCEM", currency: "INR", mv: 1381125 },
      { ticker: "INFTEC", currency: "INR", mv: 635000 },
      { ticker: "ICIBAN", currency: "INR", mv: 873672 },
    ],
  },
  {
    name: "Mixed (sample CSV)",
    holdings: [
      { ticker: "AAPL", currency: "USD", mv: 109300 },
      { ticker: "MSFT", currency: "USD", mv: 168520 },
      { ticker: "NVDA", currency: "USD", mv: 224840 },
      { ticker: "SPY", currency: "USD", mv: 221120 },
      { ticker: "RELIANCE", currency: "INR", mv: 7280000 },
      { ticker: "TCS", currency: "INR", mv: 6222000 },
      { ticker: "HDFCBANK", currency: "INR", mv: 5052000 },
    ],
  },
];

for (const s of scenarios) {
  const base = determineBase(s.holdings);
  const total = totalInBase(s.holdings, base);
  console.log(`${s.name.padEnd(40)} base=${base.padEnd(4)} total=${fmt(total, base)}`);
}
