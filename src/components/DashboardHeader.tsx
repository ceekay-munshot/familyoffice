// Persistent strip rendered below the TopBar. Shows the active portfolio's
// identity and key totals, and exposes the two destructive controls
// (Re-upload, Clear) the user needs to manage their own data.

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Upload,
  Trash2,
  X,
  AlertTriangle,
  Briefcase,
  Layers,
  TrendingUp,
  Database,
} from "lucide-react";
import { usePortfolio, activeHoldings, distinctSectors, holdingsByCoreSatellite } from "@/context/PortfolioContext";
import { fmtCurrency, fmtDateTime } from "@/lib/format";

export function DashboardHeader() {
  const navigate = useNavigate();
  const { portfolio, clearPortfolio } = usePortfolio();
  const [showConfirm, setShowConfirm] = useState(false);

  // Pre-upload variant: thin teaser strip that tells the user what's missing.
  if (!portfolio) {
    return (
      <div className="border-b border-slate-800 bg-ink-900/60 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md border border-gold-500/30 bg-gold-500/10 text-gold-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-slate-100">Family Office Dashboard</div>
              <div className="text-[11px] text-slate-500">Awaiting portfolio upload to activate analytics</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill icon={<Database className="h-3 w-3" />}>Data Mode: Local demo</Pill>
            <Link to="/upload" className="btn-primary text-xs">
              <Upload className="h-3.5 w-3.5" />
              Upload Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const active = activeHoldings(portfolio);
  const sectors = distinctSectors(portfolio).filter((s) => s !== "Unclassified");
  const sectorCount = sectors.length || distinctSectors(portfolio).length;
  const cs = holdingsByCoreSatellite(portfolio);
  // Aggregate in base currency so a mixed-currency portfolio reports a
  // coherent core/satellite split.
  const coreMV = cs.Core.reduce((s, h) => s + (h.marketValueBase ?? h.marketValue), 0);
  const satMV = cs.Satellite.reduce((s, h) => s + (h.marketValueBase ?? h.marketValue), 0);
  const totalMV = coreMV + satMV;
  const corePct = totalMV > 0 ? (coreMV / totalMV) * 100 : 0;
  const satPct = totalMV > 0 ? (satMV / totalMV) * 100 : 0;
  // If the portfolio mixes currencies, surface that we FX-adjusted the
  // total. Single-currency portfolios just show the bare currency code.
  const distinctCurrencies = new Set(
    portfolio.holdings.map((h) => h.currency).filter(Boolean) as string[],
  );
  const totalValueSub =
    distinctCurrencies.size > 1
      ? `FX-adjusted to ${portfolio.baseCurrency}`
      : `In ${portfolio.baseCurrency}`;

  return (
    <>
      <div className="border-b border-slate-800 bg-ink-900/60 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md border border-gold-500/30 bg-gold-500/10 text-gold-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-slate-100">Family Office Dashboard</div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                <span>
                  Active Portfolio: <span className="text-slate-300 mono">{portfolio.fileName}</span>
                </span>
                <span className="text-slate-700">·</span>
                <span>
                  Last Upload: <span className="text-slate-300">{fmtDateTime(portfolio.uploadedAt)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Pill icon={<Database className="h-3 w-3" />}>Data Mode: Local demo</Pill>
            <button onClick={() => navigate("/upload")} className="btn-ghost text-xs">
              <Upload className="h-3.5 w-3.5" />
              Re-upload Portfolio
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="btn-ghost text-xs text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Portfolio Data
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCell
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Total Value"
            value={fmtCurrency(portfolio.totalValue, portfolio.baseCurrency, { compact: true })}
            sub={totalValueSub}
          />
          <SummaryCell
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Current Holdings"
            value={String(active.length)}
            sub={`${portfolio.holdings.length} rows · ${portfolio.holdings.length - active.length} exited`}
          />
          <SummaryCell
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Sectors"
            value={String(sectorCount)}
            sub={sectors.slice(0, 3).join(" · ") || "Awaiting classification"}
          />
          <SummaryCell
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Core / Satellite"
            value={`${corePct.toFixed(0)}% / ${satPct.toFixed(0)}%`}
            sub={`${cs.Core.length} core · ${cs.Satellite.length} satellite`}
          />
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            clearPortfolio();
            setShowConfirm(false);
            navigate("/upload");
          }}
        />
      )}
    </>
  );
}

function SummaryCell({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-800 bg-ink-800/60 px-3 py-2">
      <div className="grid h-7 w-7 place-items-center rounded-md bg-ink-700 text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="label-xs">{label}</div>
        <div className="mt-0.5 text-sm font-semibold tabular text-slate-100">{value}</div>
        {sub && <div className="truncate text-[10px] text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

function Pill({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
      {icon}
      {children}
    </span>
  );
}

function ConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-xl border border-slate-800 bg-ink-800 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-100">Clear all portfolio data?</h3>
            <p className="mt-1 text-sm text-slate-400">
              This deletes the active portfolio, the prior snapshot used for diffs, and your upload history from this browser. This cannot be undone.
            </p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost text-xs">Cancel</button>
          <button
            onClick={onConfirm}
            className="btn text-xs bg-rose-500 text-white hover:bg-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear everything
          </button>
        </div>
      </div>
    </div>
  );
}
