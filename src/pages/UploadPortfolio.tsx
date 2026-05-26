// Upload Portfolio
//
// Two-stage flow:
//   1. Pick / drop a CSV or XLSX → parseFile() stages the upload.
//   2. The staging panel shows: field mappings, warnings, row errors, and the
//      diff against the prior active portfolio. The user either commits or
//      cancels. Only committed uploads land in localStorage.

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { usePortfolio } from "@/context/PortfolioContext";
import { SAMPLE_CSV, SAMPLE_PREVIEW_ROWS } from "@/lib/portfolioParser";
import { fmtCurrency, fmtDateTime, fmtPct } from "@/lib/format";
import type { ParseError, ParseWarning, FieldMappingTrace, ChangeSummary } from "@/lib/portfolioTypes";
import { totalChangeCount } from "@/lib/portfolioDiff";

export function UploadPortfolio() {
  const navigate = useNavigate();
  const {
    portfolio,
    staged,
    stagingError,
    isParsing,
    parseFile,
    commitStagedUpload,
    cancelStagedUpload,
  } = usePortfolio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  async function handleFile(f: File) {
    setShowFullPreview(false);
    await parseFile(f);
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "family_office_portfolio_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCommit() {
    const committed = commitStagedUpload();
    if (committed) navigate("/cio");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Setup"
        title="Upload Portfolio"
        subtitle="Drop a CSV or XLSX from your custodian or back-office. The dashboard activates once your holdings are loaded — no data leaves your browser."
        right={
          portfolio && (
            <Pill tone="gain" className="text-xs">
              <CheckCircle2 className="h-3 w-3" />
              Active: {portfolio.fileName}
            </Pill>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Drop zone */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center transition-colors ${
                dragOver
                  ? "border-gold-500 bg-gold-500/5"
                  : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/30"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  // Reset so re-uploading the same filename re-triggers change.
                  if (inputRef.current) inputRef.current.value = "";
                }}
              />
              <div className="grid h-14 w-14 place-items-center rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400">
                {isParsing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-100">
                {isParsing ? "Parsing your file…" : "Drag & drop your portfolio file"}
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-400">
                CSV or XLSX. Required columns:{" "}
                <span className="mono text-slate-300">ticker, companyName, sector, quantity, currentPrice, coreSatellite, status</span>
                . Missing classification columns get sensible defaults with a warning.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="btn-primary"
                  disabled={isParsing}
                >
                  Browse files
                </button>
                <button type="button" onClick={downloadSample} className="btn-ghost">
                  <Download className="h-4 w-4" />
                  Download sample CSV
                </button>
              </div>
              {stagingError && (
                <div className="mt-4 flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  <XCircle className="h-3.5 w-3.5" />
                  {stagingError}
                </div>
              )}
            </label>
          </Card>

          {staged && (
            <StagingReview
              warnings={staged.parse.warnings}
              errors={staged.parse.errors}
              mappings={staged.parse.fieldMappings}
              holdingsCount={staged.parse.holdings.length}
              rawRowCount={staged.parse.rawRowCount}
              totalValue={staged.parse.totalValue}
              fileName={staged.parse.fileName}
              changeSummary={staged.changeSummary}
              hasPrevious={!!portfolio}
              onCommit={handleCommit}
              onCancel={cancelStagedUpload}
            />
          )}

          <SampleSchemaCard onDownload={downloadSample} expanded={showFullPreview} onToggle={() => setShowFullPreview((v) => !v)} />
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {portfolio ? (
            <Card title="Active portfolio" pad>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between">
                  <span className="text-slate-400">File</span>
                  <span className="mono text-slate-200 truncate max-w-[140px]" title={portfolio.fileName}>
                    {portfolio.fileName}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Uploaded</span>
                  <span className="mono text-slate-200">{fmtDateTime(portfolio.uploadedAt)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Holdings</span>
                  <span className="mono text-slate-200">{portfolio.holdings.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Total value</span>
                  <span className="mono text-slate-200">
                    {fmtCurrency(portfolio.totalValue, portfolio.baseCurrency, { compact: true })}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Checksum</span>
                  <span className="mono text-slate-500 text-[10px]">{portfolio.checksum}</span>
                </li>
              </ul>
              <div className="mt-3 text-xs text-slate-400">
                Upload a new file to replace the active portfolio. The previous snapshot is retained for diffing.
              </div>
            </Card>
          ) : (
            <Card title="What happens next" pad>
              <ol className="space-y-3 text-xs text-slate-300">
                {[
                  "We parse your file client-side — no network calls.",
                  "Required columns are mapped automatically; aliases like CMP, Qty, Avg Cost are recognized.",
                  "You review a warning + error report and a diff vs. the previous upload.",
                  "Commit the upload to activate the dashboard.",
                ].map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-800 text-[10px] font-semibold text-gold-400">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <Card title="Privacy & data" pad>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>All parsing happens in your browser. Storage is local-only.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileSpreadsheet className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>Accepted: <span className="mono">.csv .xlsx .xls .txt</span></span>
              </li>
              <li className="flex items-start gap-2">
                <Eye className="mt-0.5 h-4 w-4 text-emerald-400" />
                <span>Use Clear Portfolio Data in the header to wipe state instantly.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staging review — shown after a successful parse, before commit.
// ---------------------------------------------------------------------------

function StagingReview({
  warnings,
  errors,
  mappings,
  holdingsCount,
  rawRowCount,
  totalValue,
  fileName,
  changeSummary,
  hasPrevious,
  onCommit,
  onCancel,
}: {
  warnings: ParseWarning[];
  errors: ParseError[];
  mappings: FieldMappingTrace[];
  holdingsCount: number;
  rawRowCount: number;
  totalValue: number;
  fileName: string;
  changeSummary: ChangeSummary;
  hasPrevious: boolean;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const mapped = mappings.filter((m) => m.canonical !== "unmapped");
  const unmapped = mappings.filter((m) => m.canonical === "unmapped");
  const changes = totalChangeCount(changeSummary);

  return (
    <Card
      title="Review parsed file"
      subtitle={`${fileName} · ${holdingsCount} of ${rawRowCount} rows valid · changes detected: ${changes}`}
      right={
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost text-xs">Cancel</button>
          <button onClick={onCommit} className="btn-primary text-xs" disabled={holdingsCount === 0}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Commit upload
          </button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryStat label="Rows accepted" value={holdingsCount} sub={`of ${rawRowCount} in file`} tone="info" />
        <SummaryStat label="Warnings" value={warnings.length} tone="warn" />
        <SummaryStat label="Row errors" value={errors.length} tone="loss" />
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-rose-300">
            <XCircle className="h-3.5 w-3.5" />
            Row-level errors — these rows were skipped
          </div>
          <ul className="space-y-1 text-xs text-rose-200/90">
            {errors.slice(0, 10).map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="mono text-rose-300">row {e.row}</span>
                <span className="text-rose-400">·</span>
                <span className="mono text-rose-300">{e.field}</span>
                <span className="text-rose-300">·</span>
                <span>{e.message}</span>
              </li>
            ))}
            {errors.length > 10 && (
              <li className="text-rose-300/80">… and {errors.length - 10} more</li>
            )}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            File-level warnings
          </div>
          <ul className="space-y-1 text-xs text-amber-200/90">
            {warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                {w.field && <span className="mono text-amber-300">{w.field}</span>}
                {w.field && <span className="text-amber-400">·</span>}
                <span>{w.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-ink-700/30 p-3">
          <div className="label-xs mb-2">Column mapping</div>
          <ul className="space-y-1 text-xs">
            {mapped.map((m, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="mono text-slate-300">{m.source}</span>
                <ChevronRight className="h-3 w-3 text-slate-600" />
                <span className="mono text-gold-400">{m.canonical}</span>
              </li>
            ))}
          </ul>
          {unmapped.length > 0 && (
            <>
              <div className="label-xs mt-3 mb-2">Captured as extras (preserved on each holding)</div>
              <div className="flex flex-wrap gap-1.5">
                {unmapped.slice(0, 10).map((m, i) => (
                  <Pill key={i}>{m.source}</Pill>
                ))}
                {unmapped.length > 10 && (
                  <Pill>+{unmapped.length - 10} more</Pill>
                )}
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-ink-700/30 p-3">
          <div className="label-xs mb-2">Totals</div>
          <ul className="space-y-1.5 text-xs">
            <li className="flex justify-between">
              <span className="text-slate-400">Total portfolio value</span>
              <span className="mono text-slate-100">{fmtCurrency(totalValue, "USD", { compact: true })}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-400">Valid holdings</span>
              <span className="mono text-slate-200">{holdingsCount}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-400">Rows skipped</span>
              <span className="mono text-slate-200">{rawRowCount - holdingsCount}</span>
            </li>
          </ul>
        </div>
      </div>

      <ChangeSummaryPanel summary={changeSummary} hasPrevious={hasPrevious} />
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  sub,
  tone = "info",
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "info" | "warn" | "loss" | "gain";
}) {
  const border =
    tone === "warn"
      ? "border-amber-500/30 bg-amber-500/5"
      : tone === "loss"
        ? "border-rose-500/30 bg-rose-500/5"
        : tone === "gain"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-slate-800 bg-ink-700/40";
  return (
    <div className={`rounded-lg border ${border} p-3`}>
      <div className="label-xs">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular text-slate-100">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

function ChangeSummaryPanel({ summary, hasPrevious }: { summary: ChangeSummary; hasPrevious: boolean }) {
  if (!hasPrevious) {
    return (
      <div className="mt-4 rounded-lg border border-slate-800 bg-ink-700/30 p-3 text-xs text-slate-400">
        <span className="font-medium text-slate-300">First upload.</span> No previous portfolio to diff against.
        Every holding shown above is being added fresh.
      </div>
    );
  }

  const sections = [
    { label: "Added", items: summary.added, render: (a: any) => `${a.ticker} — ${a.companyName} (qty ${a.quantity})`, tone: "gain" as const },
    { label: "Removed", items: summary.removed, render: (a: any) => `${a.ticker} — ${a.companyName}`, tone: "loss" as const },
    { label: "Quantity changed", items: summary.quantityChanged, render: (a: any) => `${a.ticker}: ${a.from} → ${a.to} (${a.delta > 0 ? "+" : ""}${a.delta})`, tone: "info" as const },
    { label: "Price changed", items: summary.priceChanged, render: (a: any) => `${a.ticker}: ${a.from} → ${a.to} (${fmtPct(a.pctChange, { sign: true })})`, tone: "info" as const },
    { label: "Weight changed", items: summary.weightChanged, render: (a: any) => `${a.ticker}: ${(a.from * 100).toFixed(2)}% → ${(a.to * 100).toFixed(2)}%`, tone: "warn" as const },
    { label: "Status changed", items: summary.statusChanged, render: (a: any) => `${a.ticker}: ${a.from} → ${a.to}`, tone: "warn" as const },
    { label: "Core/Satellite changed", items: summary.classificationChanged, render: (a: any) => `${a.ticker}: ${a.from} → ${a.to}`, tone: "warn" as const },
  ];

  const nonEmpty = sections.filter((s) => s.items.length > 0);

  if (nonEmpty.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-200">
        <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />
        No material changes versus the previous upload.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-ink-700/30 p-3">
      <div className="label-xs mb-2">Change summary vs previous upload</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {nonEmpty.map((s, i) => (
          <div key={i}>
            <div className="mb-1 flex items-center gap-2 text-xs">
              <Pill tone={s.tone}>{s.label}</Pill>
              <span className="text-slate-500">{s.items.length}</span>
            </div>
            <ul className="space-y-0.5 text-[11px] text-slate-300">
              {s.items.slice(0, 5).map((it: any, j: number) => (
                <li key={j} className="truncate">
                  {s.render(it)}
                </li>
              ))}
              {s.items.length > 5 && (
                <li className="text-slate-500">… and {s.items.length - 5} more</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sample schema preview — collapsible, with download.
// ---------------------------------------------------------------------------

function SampleSchemaCard({
  onDownload,
  expanded,
  onToggle,
}: {
  onDownload: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cols = [
    "ticker",
    "companyName",
    "assetClass",
    "sector",
    "geography",
    "quantity",
    "averageCost",
    "currentPrice",
    "marketValue",
    "portfolioWeight",
    "coreSatellite",
    "benchmark",
    "status",
  ];

  return (
    <Card
      title="Sample CSV format"
      subtitle="The canonical schema. Real files rarely match exactly — column aliases (Qty, CMP, Avg Cost, etc.) are detected automatically."
      right={
        <div className="flex gap-2">
          <button onClick={onToggle} className="btn-ghost text-xs">
            {expanded ? "Hide preview" : "Show full preview"}
          </button>
          <button onClick={onDownload} className="btn-ghost text-xs">
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      }
      pad={false}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-800">
            <tr>
              {cols.map((c) => (
                <th key={c} className="label-xs whitespace-nowrap px-3 py-2 text-left font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-xs">
            {(expanded ? SAMPLE_PREVIEW_ROWS : SAMPLE_PREVIEW_ROWS.slice(0, 2)).map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/30">
                {cols.map((c) => (
                  <td key={c} className="whitespace-nowrap px-3 py-1.5 mono text-slate-300">
                    {row[c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-800 px-4 py-2.5 text-[11px] text-slate-500">
        <span className="text-slate-400">Required minimum fields:</span> ticker, companyName, sector, quantity, currentPrice, coreSatellite, status ·{" "}
        <span className="text-slate-400">Status values:</span> Current · Exited · Watchlist ·{" "}
        <span className="text-slate-400">Sleeve:</span> Core · Satellite
      </div>
    </Card>
  );
}
