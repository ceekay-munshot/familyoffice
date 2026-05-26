// FX conversion utilities.
//
// Rates are intentionally static here. A real implementation would pull
// from a daily-rates feed; for now we bake in a single snapshot so a
// portfolio that mixes USD-denominated and INR-denominated holdings can
// still display a coherent total in whichever base currency dominates.
//
// To refresh the rates later, replace RATES_USD with values from your
// preferred source (e.g., ECB, OANDA daily fix). The rest of the app
// doesn't need to change.

export const SUPPORTED_DISPLAY_CURRENCIES = ["USD", "INR", "EUR", "GBP"] as const;
export type DisplayCurrency = (typeof SUPPORTED_DISPLAY_CURRENCIES)[number];

// 1 unit of [code] = N USD.
const RATES_USD: Record<string, number> = {
  USD: 1,
  INR: 1 / 83.5,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0064,
  HKD: 0.128,
  SGD: 0.74,
  CAD: 0.73,
  AUD: 0.66,
  CNY: 0.138,
};

export function rateToUSD(code: string): number {
  return RATES_USD[code] ?? 1;
}

// Convert an amount from one currency to another. Unknown currencies are
// treated as USD-equivalent (no-op) — the parser warns when it can't
// classify a holding so the user knows.
export function fxConvert(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const usd = amount * rateToUSD(from);
  const toRate = rateToUSD(to);
  return toRate === 0 ? usd : usd / toRate;
}

// Map a geography string (parsed from the user's file) to an ISO currency
// code. Anything we don't recognize defaults to USD.
export function currencyForGeography(geo: string): string {
  const map: Record<string, string> = {
    US: "USD",
    USA: "USD",
    "United States": "USD",
    India: "INR",
    IN: "INR",
    UK: "GBP",
    "United Kingdom": "GBP",
    Europe: "EUR",
    EU: "EUR",
    "Hong Kong": "HKD",
    HK: "HKD",
    Canada: "CAD",
    Japan: "JPY",
    Singapore: "SGD",
    Australia: "AUD",
    China: "CNY",
    Global: "USD",
    Unknown: "USD",
  };
  return map[geo] ?? "USD";
}

function isDisplayCurrency(c: string): c is DisplayCurrency {
  return (SUPPORTED_DISPLAY_CURRENCIES as readonly string[]).includes(c);
}

// Pick the base currency for the portfolio:
//  - If every holding shares the same (supported) currency, use it.
//  - Otherwise, the currency with the largest USD-normalized market value
//    wins, falling back to USD if no supported currency dominates.
export function determineBaseCurrency(
  holdings: { currency: string; marketValue: number }[],
): DisplayCurrency {
  if (holdings.length === 0) return "USD";

  const distinct = new Set(holdings.map((h) => h.currency));
  if (distinct.size === 1) {
    const only = [...distinct][0];
    if (isDisplayCurrency(only)) return only;
  }

  const usdTotals: Record<string, number> = {};
  for (const h of holdings) {
    const usd = h.marketValue * rateToUSD(h.currency);
    usdTotals[h.currency] = (usdTotals[h.currency] || 0) + usd;
  }

  let bestCode: DisplayCurrency = "USD";
  let bestUSD = -Infinity;
  for (const [code, total] of Object.entries(usdTotals)) {
    if (isDisplayCurrency(code) && total > bestUSD) {
      bestUSD = total;
      bestCode = code;
    }
  }
  return bestCode;
}
