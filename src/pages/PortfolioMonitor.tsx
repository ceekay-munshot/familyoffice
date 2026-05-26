import { useMemo, useState } from "react";
import { ArrowUpDown, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { usePortfolio } from "@/context/PortfolioContext";
import { changeColor, fmtCurrency, fmtNum, fmtPct } from "@/lib/format";

type SortKey = "weight" | "mv" | "pnl" | "ret" | "ticker";

function holdingCurrency(geo: string): "USD" | "INR" {
  return geo === "India" ? "INR" : "USD";
}

export function PortfolioMonitor() {
  const { portfolio } = usePortfolio();
  const [sortKey, setSortKey] = useState<SortKey>("weight");
  const [sortDesc, setSortDesc] = useState(true);
  const [filterSector, setFilterSector] = useState<string>("All");
  const [filterClassification, setFilterClassification] = useState<string>("All");
  const [filterGeography, setFilterGeography] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  if (!portfolio) return null;

  const rows = useMemo(() => {
    const filtered = portfolio.holdings.filter((h) => {
      if (filterSector !== "All" && h.sector !== filterSector) return false;
      if (filterClassification !== "All" && h.coreSatellite !== filterClassification) return false;
      if (filterGeography !== "All" && h.geography !== filterGeography) return false;
      if (filterStatus !== "All" && h.status !== filterStatus) return false;
      return true;
    });
    const cmp = (a: typeof filtered[number], b: typeof filtered[number]) => {
      switch (sortKey) {
        case "weight":
          return a.portfolioWeight - b.portfolioWeight;
        case "mv":
          return a.marketValue - b.marketValue;
        case "pnl":
          return a.unrealizedPnL - b.unrealizedPnL;
        case "ret":
          return a.returnPct - b.returnPct;
        case "ticker":
          return a.ticker.localeCompare(b.ticker);
      }
    };
    return [...filtered].sort((a, b) => (sortDesc ? cmp(b, a) : cmp(a, b)));
  }, [portfolio.holdings, filterSector, filterClassification, filterGeography, filterStatus, sortKey, sortDesc]);

  const sectors = Array.from(new Set(portfolio.holdings.map((h) => h.sector)));
  const geographies = Array.from(new Set(portfolio.holdings.map((h) => h.geography)));

  function head(label: string, key: SortKey, align: "left" | "right" = "right") {
    const active = sortKey === key;
    return (
      <th
        scope="col"
        className={`label-xs cursor-pointer select-none px-3 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}
        onClick={() => {
          if (active) setSortDesc((d) => !d);
          else {
            setSortKey(key);
            setSortDesc(true);
          }
        }}
      >
        <span className={`inline-flex items-center gap-1 ${active ? "text-slate-200" : ""}`}>
          {label}
          <ArrowUpDown className="h-3 w-3 opacity-60" />
        </span>
      </th>
    );
  }

  // Footer aggregates use FX-normalized values so the filtered total
  // matches the header NAV when no filter is applied.
  const totalFilteredMV = rows.reduce((s, h) => s + (h.marketValueBase ?? h.marketValue), 0);
  const totalFilteredPnL = rows.reduce((s, h) => s + (h.unrealizedPnLBase ?? h.unrealizedPnL), 0);
  const totalFilteredWeight = rows.reduce((s, h) => s + h.portfolioWeight, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Holdings"
        title="Portfolio Monitor"
        subtitle="Position-level table. Sort, filter, and inspect every holding."
        right={
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>
              {rows.length} of {portfolio.holdings.length} holdings
            </span>
          </div>
        }
      />

      <Card className="mb-4" pad>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect label="Sector" value={filterSector} options={["All", ...sectors]} onChange={setFilterSector} />
          <FilterSelect label="Classification" value={filterClassification} options={["All", "Core", "Satellite"]} onChange={setFilterClassification} />
          <FilterSelect label="Geography" value={filterGeography} options={["All", ...geographies]} onChange={setFilterGeography} />
          <FilterSelect label="Status" value={filterStatus} options={["All", "Current", "Watchlist", "Exited"]} onChange={setFilterStatus} />
        </div>
      </Card>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-slate-800">
              <tr>
                {head("Ticker", "ticker", "left")}
                <th className="label-xs px-3 py-2 text-left font-medium">Company</th>
                <th className="label-xs px-3 py-2 text-left font-medium">Sector</th>
                <th className="label-xs px-3 py-2 text-left font-medium">Class</th>
                <th className="label-xs px-3 py-2 text-left font-medium">Status</th>
                <th className="label-xs px-3 py-2 text-right font-medium">Qty</th>
                <th className="label-xs px-3 py-2 text-right font-medium">Avg Cost</th>
                <th className="label-xs px-3 py-2 text-right font-medium">CMP</th>
                {head("Return %", "ret")}
                {head("Market Value", "mv")}
                {head("Unrealized P&L", "pnl")}
                {head("Weight", "weight")}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {rows.map((h) => {
                const curr = holdingCurrency(h.geography);
                return (
                  <tr key={h.ticker} className="text-sm hover:bg-slate-800/30">
                    <td className="px-3 py-2.5">
                      <div className="mono font-semibold text-slate-100">{h.ticker}</div>
                      <div className="text-[10px] text-slate-500">{h.geography}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      <div className="truncate max-w-[220px]">{h.companyName}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{h.sector}</td>
                    <td className="px-3 py-2.5">
                      <Pill tone={h.coreSatellite === "Core" ? "core" : "satellite"}>{h.coreSatellite}</Pill>
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill
                        tone={h.status === "Current" ? "gain" : h.status === "Watchlist" ? "warn" : "default"}
                      >
                        {h.status}
                      </Pill>
                    </td>
                    <td className="px-3 py-2.5 text-right mono text-slate-300">{fmtNum(h.quantity)}</td>
                    <td className="px-3 py-2.5 text-right mono text-slate-400">
                      {fmtCurrency(h.averageCost, curr)}
                    </td>
                    <td className="px-3 py-2.5 text-right mono text-slate-200">
                      {fmtCurrency(h.currentPrice, curr)}
                    </td>
                    <td className={`px-3 py-2.5 text-right mono ${changeColor(h.returnPct)}`}>
                      {fmtPct(h.returnPct, { sign: true })}
                    </td>
                    <td className="px-3 py-2.5 text-right mono text-slate-100">
                      {fmtCurrency(h.marketValue, curr, { compact: true })}
                    </td>
                    <td className={`px-3 py-2.5 text-right mono ${changeColor(h.unrealizedPnL)}`}>
                      {fmtCurrency(h.unrealizedPnL, curr, { compact: true, sign: true })}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="mono text-slate-200">{(h.portfolioWeight * 100).toFixed(2)}%</div>
                      <div className="mt-1 ml-auto h-1 w-16 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-gold-500/70"
                          style={{ width: `${Math.min(100, h.portfolioWeight * 100 * 3)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-xs text-slate-500">
                    No holdings match the current filter set.
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-800">
                  <td colSpan={9} className="px-3 py-2.5 text-xs uppercase tracking-wider text-slate-500">
                    Filtered total
                  </td>
                  <td className="px-3 py-2.5 text-right mono text-slate-100">
                    {fmtCurrency(totalFilteredMV, portfolio.baseCurrency, { compact: true })}
                  </td>
                  <td className={`px-3 py-2.5 text-right mono ${changeColor(totalFilteredPnL)}`}>
                    {fmtCurrency(totalFilteredPnL, portfolio.baseCurrency, { compact: true, sign: true })}
                  </td>
                  <td className="px-3 py-2.5 text-right mono text-slate-100">
                    {(totalFilteredWeight * 100).toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      <span className="label-xs">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-700 bg-ink-700 px-2 py-1.5 text-xs text-slate-200 ring-focus"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
