import { useMemo, useState } from "react";
import { ArrowUpDown, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { usePortfolio } from "@/context/PortfolioContext";
import { changeColor, fmtCurrency, fmtNum, fmtPct } from "@/lib/format";
import {
  mvBase,
  pnlBase,
  vehicleOf,
  managerOf,
  familyOf,
  isManagerVehicle,
  purchasedInFY,
} from "@/lib/portfolioAnalytics";
import { ALL_VEHICLES } from "@/lib/portfolioTypes";

type SortKey = "weight" | "mv" | "pnl" | "ret" | "ticker";
type Scope = "Consolidated" | "Direct (no managers)" | "Via managers";

const CURRENT_FY = 2026; // FY2026-27 (as of 30 Jun 2026)

function holdingCurrency(geo: string): "USD" | "INR" {
  return geo === "India" ? "INR" : "USD";
}

export function PortfolioMonitor() {
  const { portfolio, fmtFromBase } = usePortfolio();
  const [sortKey, setSortKey] = useState<SortKey>("weight");
  const [sortDesc, setSortDesc] = useState(true);
  const [scope, setScope] = useState<Scope>("Consolidated");
  const [filterVehicle, setFilterVehicle] = useState<string>("All");
  const [filterManager, setFilterManager] = useState<string>("All");
  const [filterFamily, setFilterFamily] = useState<string>("All");
  const [filterSector, setFilterSector] = useState<string>("All");
  const [filterClassification, setFilterClassification] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterPurchased, setFilterPurchased] = useState<string>("All");

  if (!portfolio) return null;

  const rows = useMemo(() => {
    const filtered = portfolio.holdings.filter((h) => {
      if (scope === "Direct (no managers)" && isManagerVehicle(h)) return false;
      if (scope === "Via managers" && !isManagerVehicle(h)) return false;
      if (filterVehicle !== "All" && vehicleOf(h) !== filterVehicle) return false;
      if (filterManager !== "All" && managerOf(h) !== filterManager) return false;
      if (filterFamily !== "All" && familyOf(h) !== filterFamily) return false;
      if (filterSector !== "All" && h.sector !== filterSector) return false;
      if (filterClassification !== "All" && h.coreSatellite !== filterClassification) return false;
      if (filterStatus !== "All" && h.status !== filterStatus) return false;
      if (filterPurchased === "This FY" && !purchasedInFY(h, CURRENT_FY)) return false;
      if (filterPurchased === "Last FY" && !purchasedInFY(h, CURRENT_FY - 1)) return false;
      return true;
    });
    const cmp = (a: typeof filtered[number], b: typeof filtered[number]) => {
      switch (sortKey) {
        case "weight": return a.portfolioWeight - b.portfolioWeight;
        case "mv": return mvBase(a) - mvBase(b);
        case "pnl": return pnlBase(a) - pnlBase(b);
        case "ret": return a.returnPct - b.returnPct;
        case "ticker": return a.ticker.localeCompare(b.ticker);
      }
    };
    return [...filtered].sort((a, b) => (sortDesc ? cmp(b, a) : cmp(a, b)));
  }, [portfolio.holdings, scope, filterVehicle, filterManager, filterFamily, filterSector, filterClassification, filterStatus, filterPurchased, sortKey, sortDesc]);

  const sectors = Array.from(new Set(portfolio.holdings.map((h) => h.sector)));
  const managers = Array.from(new Set(portfolio.holdings.map(managerOf))).sort();
  const families = Array.from(new Set(portfolio.holdings.map(familyOf))).sort();

  function head(label: string, key: SortKey, align: "left" | "right" = "right") {
    const active = sortKey === key;
    return (
      <th
        scope="col"
        className={`label-xs cursor-pointer select-none px-3 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}
        onClick={() => {
          if (active) setSortDesc((d) => !d);
          else { setSortKey(key); setSortDesc(true); }
        }}
      >
        <span className={`inline-flex items-center gap-1 ${active ? "text-slate-200" : ""}`}>
          {label}
          <ArrowUpDown className="h-3 w-3 opacity-60" />
        </span>
      </th>
    );
  }

  const totalFilteredMV = rows.reduce((s, h) => s + mvBase(h), 0);
  const totalFilteredPnL = rows.reduce((s, h) => s + pnlBase(h), 0);
  const totalFilteredWeight = rows.reduce((s, h) => s + h.portfolioWeight, 0);

  const SCOPES: Scope[] = ["Consolidated", "Direct (no managers)", "Via managers"];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        eyebrow="Holdings"
        title="Portfolio Monitor"
        subtitle="Every position across direct equity, mutual funds, PMS, AIFs and private — slice by vehicle, manager, entity or purchase date."
        right={
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>{rows.length} of {portfolio.holdings.length} holdings</span>
          </div>
        }
      />

      <Card className="mb-4" pad>
        <div className="mb-3 inline-flex items-center gap-0.5 rounded-md border border-slate-700 bg-ink-800/60 p-0.5">
          {SCOPES.map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={[
                "rounded px-2.5 py-1 text-xs font-medium transition-colors active:scale-[0.97]",
                scope === s ? "bg-gold-500 text-ink-950" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect label="Vehicle" value={filterVehicle} options={["All", ...ALL_VEHICLES]} onChange={setFilterVehicle} />
          <FilterSelect label="Manager" value={filterManager} options={["All", ...managers]} onChange={setFilterManager} />
          <FilterSelect label="Owner" value={filterFamily} options={["All", ...families]} onChange={setFilterFamily} />
          <FilterSelect label="Sector" value={filterSector} options={["All", ...sectors]} onChange={setFilterSector} />
          <FilterSelect label="Class" value={filterClassification} options={["All", "Core", "Satellite"]} onChange={setFilterClassification} />
          <FilterSelect label="Status" value={filterStatus} options={["All", "Current", "Watchlist", "Exited"]} onChange={setFilterStatus} />
          <FilterSelect label="Purchased" value={filterPurchased} options={["All", "This FY", "Last FY"]} onChange={setFilterPurchased} />
        </div>
      </Card>

      <Card pad={false} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-full">
            <thead>
              <tr className="sticky top-0 z-20 border-b border-slate-800 bg-ink-800">
                <th
                  scope="col"
                  className="sticky left-0 z-30 cursor-pointer select-none bg-ink-800 px-3 py-2 text-left label-xs font-medium"
                  onClick={() => { if (sortKey === "ticker") setSortDesc((d) => !d); else { setSortKey("ticker"); setSortDesc(true); } }}
                >
                  <span className={`inline-flex items-center gap-1 ${sortKey === "ticker" ? "text-slate-200" : ""}`}>
                    Ticker
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </span>
                </th>
                <th className="label-xs px-3 py-2 text-left font-medium">Company</th>
                <th className="label-xs px-3 py-2 text-left font-medium">Vehicle</th>
                <th className="label-xs px-3 py-2 text-left font-medium">Owner</th>
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
                const intl = h.geography !== "India";
                return (
                  <tr key={`${h.ticker}-${h.manager}`} className="group text-sm hover:bg-slate-800/30">
                    <td className="sticky left-0 z-10 bg-ink-800 px-3 py-2.5 group-hover:bg-ink-700">
                      <div className="mono font-semibold text-slate-100">{h.ticker}</div>
                      <div className={`text-[10px] ${intl ? "text-sky-400" : "text-slate-500"}`}>{h.geography}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      <div className="max-w-[200px] truncate">{h.companyName}</div>
                      {isManagerVehicle(h) && <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{managerOf(h)}</div>}
                    </td>
                    <td className="px-3 py-2.5"><Pill tone={isManagerVehicle(h) ? "info" : "default"}>{vehicleOf(h)}</Pill></td>
                    <td className="px-3 py-2.5 text-slate-400"><div className="max-w-[120px] truncate">{familyOf(h)}</div></td>
                    <td className="px-3 py-2.5 text-slate-400">{h.sector}</td>
                    <td className="px-3 py-2.5"><Pill tone={h.coreSatellite === "Core" ? "core" : "satellite"}>{h.coreSatellite}</Pill></td>
                    <td className="px-3 py-2.5"><Pill tone={h.status === "Current" ? "gain" : h.status === "Watchlist" ? "warn" : "default"}>{h.status}</Pill></td>
                    <td className="px-3 py-2.5 text-right mono text-slate-300">{fmtNum(h.quantity)}</td>
                    <td className="px-3 py-2.5 text-right mono text-slate-400">{fmtCurrency(h.averageCost, curr)}</td>
                    <td className="px-3 py-2.5 text-right mono text-slate-200">{fmtCurrency(h.currentPrice, curr)}</td>
                    <td className={`px-3 py-2.5 text-right mono ${changeColor(h.returnPct)}`}>{fmtPct(h.returnPct, { sign: true })}</td>
                    <td className="px-3 py-2.5 text-right mono text-slate-100">{fmtFromBase(mvBase(h), { compact: true })}</td>
                    <td className={`px-3 py-2.5 text-right mono ${changeColor(pnlBase(h))}`}>{fmtFromBase(pnlBase(h), { compact: true, sign: true })}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="mono text-slate-200">{(h.portfolioWeight * 100).toFixed(2)}%</div>
                      <div className="mt-1 ml-auto h-1 w-16 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full bg-gold-500/70" style={{ width: `${Math.min(100, h.portfolioWeight * 100 * 3)}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-3 py-8 text-center text-xs text-slate-500">
                    No holdings match the current filter set.
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-800">
                  <td colSpan={11} className="px-3 py-2.5 text-xs uppercase tracking-wider text-slate-500">Filtered total</td>
                  <td className="px-3 py-2.5 text-right mono text-slate-100">{fmtFromBase(totalFilteredMV, { compact: true })}</td>
                  <td className={`px-3 py-2.5 text-right mono ${changeColor(totalFilteredPnL)}`}>{fmtFromBase(totalFilteredPnL, { compact: true, sign: true })}</td>
                  <td className="px-3 py-2.5 text-right mono text-slate-100">{(totalFilteredWeight * 100).toFixed(2)}%</td>
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
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
