import { useMemo, useState } from "react";
import { Newspaper, TrendingUp, Activity, Globe2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { usePortfolio } from "@/context/PortfolioContext";
import { fmtDate, relativeTime } from "@/lib/format";
import { MOCK_NEWS } from "@/data/mockNews";

const SECTOR_PULSE = [
  { sector: "Technology", sentiment: 78, momentum: "accelerating", note: "AI capex cycle absorbing supply; mega-cap concentration risk persists." },
  { sector: "Financials", sentiment: 52, momentum: "stabilizing", note: "NIM trough behind us in US; India private banks margin recovery in motion." },
  { sector: "Healthcare", sentiment: 34, momentum: "deteriorating", note: "Managed-care regulatory overhang; GLP-1 winners decoupling from sector." },
  { sector: "Consumer Discretionary", sentiment: 58, momentum: "mixed", note: "Premium consumer resilient; mid-market spending softer." },
  { sector: "Consumer Staples", sentiment: 62, momentum: "stabilizing", note: "Pricing power normalizing; volumes recovering." },
  { sector: "Energy", sentiment: 55, momentum: "supportive", note: "OPEC+ discipline supportive; demand growth tracking +1.1mb/d." },
  { sector: "Communication Services", sentiment: 70, momentum: "accelerating", note: "Ad inventory pricing firm; AI monetization narrative intact." },
];

const COMPETITOR_MOVES = [
  { sector: "Technology", title: "AMD MI400 launch slips into mid-2027", impact: "NVDA competitive moat extends another 6–9 months.", affects: ["NVDA"] },
  { sector: "Healthcare", title: "Novo Nordisk orforglipron Phase 3 readout in Q3", impact: "Potential LLY pressure if oral GLP-1 data is competitive.", affects: ["LLY"] },
  { sector: "Financials", title: "Capital One ↑ ICICI bid; consolidation chatter", impact: "Multiple re-rating possible across US regional banks; less impact on JPM/HDFCB.", affects: ["JPM", "HDFCBANK"] },
  { sector: "Energy", title: "Shell pares LNG capex; integrated supply discipline", impact: "XOM, Reliance refining-petchem complex relatively better positioned.", affects: ["XOM", "RELIANCE"] },
];

const REGULATORY = [
  { date: "1d ago", body: "DOJ widens UNH inquiry to Optum care-delivery practices.", tickers: ["UNH"] },
  { date: "2d ago", body: "RBI MPC holds repo at 6.50%; CRR debate noted in minutes.", tickers: ["HDFCBANK", "BAJFINANCE"] },
  { date: "5d ago", body: "EU Digital Markets Act — Apple App Store remedies under scope.", tickers: ["AAPL"] },
];

export function SectorIntelligence() {
  const { portfolio } = usePortfolio();
  const [scope, setScope] = useState<"All" | "My Sectors">("My Sectors");

  if (!portfolio) return null;
  const mySectors = new Set(portfolio.holdings.map((h) => h.sector));
  const myTickers = new Set(portfolio.holdings.map((h) => h.ticker));

  const filteredPulse = useMemo(
    () => (scope === "All" ? SECTOR_PULSE : SECTOR_PULSE.filter((s) => mySectors.has(s.sector))),
    [scope, mySectors],
  );

  const newsBySector = useMemo(() => {
    const grouped: Record<string, typeof MOCK_NEWS> = {};
    for (const n of MOCK_NEWS) {
      for (const s of n.sectors) {
        if (scope === "My Sectors" && !mySectors.has(s as string)) continue;
        grouped[s] = grouped[s] || [];
        grouped[s].push(n);
      }
    }
    return grouped;
  }, [scope, mySectors]);

  return (
    <div>
      <PageHeader
        eyebrow="Intelligence"
        title="Sector / Competitor Intelligence"
        subtitle="Sector pulse, competitor moves, and regulatory signal — scoped to what you actually own."
        right={
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="rounded-md border border-slate-700 bg-ink-700 px-2 py-1 text-xs text-slate-200 ring-focus"
            >
              <option>My Sectors</option>
              <option>All</option>
            </select>
          </div>
        }
      />

      <Card className="mb-5" title="Sector pulse" subtitle="Sentiment & momentum across the sectors you're invested in" pad={false}>
        <table className="min-w-full">
          <thead className="border-b border-slate-800">
            <tr>
              <th className="label-xs px-4 py-2 text-left font-medium">Sector</th>
              <th className="label-xs px-4 py-2 text-left font-medium">Sentiment</th>
              <th className="label-xs px-4 py-2 text-left font-medium">Momentum</th>
              <th className="label-xs px-4 py-2 text-left font-medium">Read</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-sm">
            {filteredPulse.map((s) => (
              <tr key={s.sector} className="hover:bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-200 font-medium">{s.sector}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full ${s.sentiment >= 60 ? "bg-emerald-400" : s.sentiment >= 45 ? "bg-amber-400" : "bg-rose-400"}`}
                        style={{ width: `${s.sentiment}%` }}
                      />
                    </div>
                    <span className="mono text-xs text-slate-300">{s.sentiment}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <Pill
                    tone={
                      s.momentum === "accelerating" || s.momentum === "supportive"
                        ? "gain"
                        : s.momentum === "deteriorating"
                          ? "loss"
                          : "default"
                    }
                  >
                    {s.momentum}
                  </Pill>
                </td>
                <td className="px-4 py-2.5 text-slate-400">{s.note}</td>
              </tr>
            ))}
            {filteredPulse.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-500">
                  No sectors in the pulse feed overlap with your holdings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Competitor moves & strategic events">
          <ul className="space-y-3">
            {COMPETITOR_MOVES.filter((m) => scope === "All" || mySectors.has(m.sector)).map((m, i) => (
              <li key={i} className="rounded-lg border border-slate-800 bg-ink-700/40 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
                  <Activity className="h-3.5 w-3.5" />
                  <span>{m.sector}</span>
                </div>
                <div className="mt-1 text-sm font-medium text-slate-100">{m.title}</div>
                <div className="mt-1 text-xs text-slate-400">{m.impact}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.affects.map((t) => (
                    <Pill key={t} tone={myTickers.has(t) ? "warn" : "default"}>{t}</Pill>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Regulatory & macro signal">
          <ul className="space-y-3">
            {REGULATORY.filter((r) => scope === "All" || r.tickers.some((t) => myTickers.has(t))).map((r, i) => (
              <li key={i} className="rounded-lg border border-slate-800 bg-ink-700/40 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
                  <Globe2 className="h-3.5 w-3.5" />
                  <span>{r.date}</span>
                </div>
                <div className="mt-1 text-sm text-slate-200">{r.body}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.tickers.map((t) => (
                    <Pill key={t} tone={myTickers.has(t) ? "warn" : "default"}>{t}</Pill>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-5 space-y-4">
        {Object.entries(newsBySector).map(([sector, items]) => (
          <Card key={sector} title={sector} subtitle={`${items.length} items`} pad>
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id} className="flex gap-3 rounded-md border border-slate-800 bg-ink-700/30 p-3">
                  <Newspaper className="mt-0.5 h-4 w-4 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
                      <span>{n.source}</span>
                      <span>·</span>
                      <span>{fmtDate(n.date)}</span>
                      <span>·</span>
                      <span>{relativeTime(n.date)}</span>
                      <Pill
                        tone={n.impact === "positive" ? "gain" : n.impact === "negative" ? "loss" : "default"}
                        className="ml-auto"
                      >
                        {n.impact}
                      </Pill>
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-100">{n.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{n.summary}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {n.tickers.map((t) => (
                        <Pill key={t} tone={myTickers.has(t) ? "warn" : "default"}>{t}</Pill>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <TrendingUp className="h-5 w-5 text-gold-400" />
          <div className="text-xs text-slate-400">
            Pulse, competitor signals, and regulatory feeds will be wired to live sources via your data adapter layer.
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4 sm:col-span-2">
          <Activity className="h-5 w-5 text-gold-400" />
          <div className="text-xs text-slate-400">
            Today this view is rules-driven against your holdings; LLM correlation for cross-sector second-order effects is roadmap-ready.
          </div>
        </div>
      </div>
    </div>
  );
}
