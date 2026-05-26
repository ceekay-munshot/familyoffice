import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { activeHoldings, usePortfolio } from "@/context/PortfolioContext";
import { fmtCurrency } from "@/lib/format";

const PALETTE = [
  "#d4af37",
  "#3b82f6",
  "#10b981",
  "#a855f7",
  "#f97316",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
  "#facc15",
  "#8b5cf6",
  "#64748b",
];

export function SectorComposition() {
  const { portfolio } = usePortfolio();
  if (!portfolio) return null;
  const holdings = activeHoldings(portfolio);
  // Aggregate by FX-normalized market value so sector mix is currency-agnostic.
  const mvOf = (h: { marketValueBase?: number; marketValue: number }) =>
    h.marketValueBase ?? h.marketValue;
  const totalMV = holdings.reduce((s, h) => s + mvOf(h), 0);

  const rows = useMemo(() => {
    const map: Record<string, { mv: number; positions: number }> = {};
    for (const h of holdings) {
      map[h.sector] = map[h.sector] || { mv: 0, positions: 0 };
      map[h.sector].mv += mvOf(h);
      map[h.sector].positions += 1;
    }
    return Object.entries(map)
      .map(([sector, v]) => ({
        sector,
        mv: v.mv,
        positions: v.positions,
        actual: totalMV > 0 ? v.mv / totalMV : 0,
      }))
      .sort((a, b) => b.mv - a.mv);
  }, [holdings, totalMV]);

  const sectorColor = (idx: number) => PALETTE[idx % PALETTE.length];

  const donutData = rows.map((r, i) => ({
    name: r.sector,
    value: r.mv,
    color: sectorColor(i),
  }));

  const compareBars = rows.map((r) => ({
    name: r.sector.length > 12 ? r.sector.slice(0, 11) + "…" : r.sector,
    fullName: r.sector,
    weight: r.actual * 100,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Allocation"
        title="Sector Composition"
        subtitle="Sector tilts across your active holdings."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Sector mix" subtitle="Share of active NAV">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={56} outerRadius={92} paddingAngle={1.5} stroke="none">
                  {donutData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => fmtCurrency(v, portfolio.baseCurrency, { compact: true })}
                  contentStyle={{ background: "#0f1525", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {rows.slice(0, 10).map((r, i) => (
              <li key={r.sector} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm" style={{ background: sectorColor(i) }} />
                <span className="flex-1 truncate text-slate-300">{r.sector}</span>
                <span className="mono text-slate-200">{(r.actual * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2" title="Sector weights" subtitle="Concentration ranked by share">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareBars} margin={{ top: 8, right: 8, left: -8, bottom: 32 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "#0f1525", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload?.fullName as string) ?? ""}
                />
                <Bar dataKey="weight" fill="#d4af37" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-5" title="Sector breakdown" pad={false}>
        <table className="min-w-full">
          <thead className="border-b border-slate-800">
            <tr>
              <th className="label-xs px-4 py-2 text-left font-medium">Sector</th>
              <th className="label-xs px-4 py-2 text-right font-medium">Positions</th>
              <th className="label-xs px-4 py-2 text-right font-medium">Mkt Value</th>
              <th className="label-xs px-4 py-2 text-right font-medium">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-sm">
            {rows.map((r, i) => (
              <tr key={r.sector} className="hover:bg-slate-800/30">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm" style={{ background: sectorColor(i) }} />
                    <span className="text-slate-200">{r.sector}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right mono text-slate-300">{r.positions}</td>
                <td className="px-4 py-2.5 text-right mono text-slate-200">
                  {fmtCurrency(r.mv, portfolio.baseCurrency, { compact: true })}
                </td>
                <td className="px-4 py-2.5 text-right mono text-slate-100">{(r.actual * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
