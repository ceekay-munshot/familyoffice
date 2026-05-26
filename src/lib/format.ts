// Currency / number / date formatters used across the dashboard. Centralized
// so the whole app uses the same conventions (and we don't have 12 versions
// of "format USD compact").

export type CurrencyCode = "USD" | "INR" | "Mixed";

export function fmtCurrency(
  n: number,
  code: CurrencyCode = "USD",
  opts?: { compact?: boolean; sign?: boolean },
): string {
  // "Mixed" portfolios contain holdings in multiple currencies; we present
  // the total in USD as the lowest-common denominator. A future FX layer can
  // refine this.
  const effective = code === "Mixed" ? "USD" : code;
  const locale = effective === "INR" ? "en-IN" : "en-US";

  const sign = opts?.sign && n > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: effective,
    notation: opts?.compact ? "compact" : "standard",
    maximumFractionDigits: opts?.compact ? 2 : 2,
    minimumFractionDigits: 0,
  }).format(n);
  return sign + formatted;
}

// Legacy alias — many components still call fmtUSD; route it through fmtCurrency.
export function fmtUSD(n: number, opts?: { compact?: boolean; sign?: boolean }): string {
  return fmtCurrency(n, "USD", opts);
}

export function fmtPct(n: number, opts?: { sign?: boolean; decimals?: number }): string {
  const sign = opts?.sign && n > 0 ? "+" : "";
  const d = opts?.decimals ?? 2;
  return `${sign}${n.toFixed(d)}%`;
}

export function fmtNum(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function changeColor(n: number): string {
  if (n > 0) return "text-gain";
  if (n < 0) return "text-loss";
  return "text-slate-400";
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return fmtDate(iso);
}

// Format a basis-point delta for weight changes.
export function fmtBps(bps: number, opts?: { sign?: boolean }): string {
  const sign = opts?.sign && bps > 0 ? "+" : "";
  const abs = Math.round(Math.abs(bps));
  return `${sign}${bps < 0 ? "-" : ""}${abs} bps`;
}
