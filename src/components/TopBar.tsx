import { Bell, Search, Sun, Moon, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { fmtDateTime } from "@/lib/format";

export function TopBar() {
  const { portfolio } = usePortfolio();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.classList.add("dark");
    else html.classList.remove("dark");
  }, [isDark]);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-slate-800 bg-ink-900/85 px-6 backdrop-blur">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search holdings, brokers, news…"
          className="w-full rounded-md border border-slate-800 bg-ink-800 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 ring-focus"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-slate-400">
            {portfolio ? "Live" : "Awaiting data"} ·{" "}
            <span className="text-slate-500">{fmtDateTime(new Date().toISOString())}</span>
          </span>
        </div>

        <button className="btn-ghost h-9 px-2.5" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsDark((v) => !v)}
          className="btn-ghost h-9 px-2.5"
          title="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="btn-ghost relative h-9 px-2.5" title="Notifications">
          <Bell className="h-4 w-4" />
          {portfolio && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
          )}
        </button>
      </div>
    </header>
  );
}
