"use client";

import { useState } from "react";
import { cn, formatPercent } from "@/lib/utils";
import type { DiagnosticsPayload } from "@/lib/types";

export function DiagnosticsPanel({ diagnostics }: { diagnostics: DiagnosticsPayload }) {
  const [open, setOpen] = useState(false);
  const geo = diagnostics.detected_geography;

  return (
    <div className="rounded-lg card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-[#252219] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-stone-400 dark:text-[#6B6560]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
          </svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-[#6B6560]">Diagnostics</span>
        </div>
        <svg
          className={cn("w-3.5 h-3.5 text-stone-400 dark:text-[#6B6560] transition-transform duration-200", open && "rotate-180")}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-stone-100 dark:border-[#2C2924]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
            <Metric
              label="Geography"
              value={geo ? `${capitalize(geo)} (${formatPercent(diagnostics.geography_confidence)})` : "Unknown"}
              ok={!!geo}
            />
            <Metric label="Evidence"     value={String(diagnostics.evidence_count)}           ok={diagnostics.evidence_count >= 3} />
            <Metric label="Claims"       value={String(diagnostics.claims_extracted)}          ok={diagnostics.claims_extracted > 0} />
            <Metric
              label="With evidence"
              value={`${diagnostics.claims_with_evidence}/${diagnostics.claims_extracted}`}
              ok={diagnostics.claims_with_evidence > 0}
            />
            <Metric
              label="Low relevance"
              value={formatPercent(diagnostics.low_relevance_ratio)}
              ok={diagnostics.low_relevance_ratio < 0.5}
              warn={diagnostics.low_relevance_ratio > 0.7}
            />
          </div>

          {diagnostics.search_errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-600 dark:text-red-500">Search warnings</p>
              {diagnostics.search_errors.map((err, i) => (
                <p key={i} className="text-[11px] text-red-700/70 dark:text-red-400/70 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded px-3 py-2 font-mono">
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Metric({ label, value, ok, warn }: { label: string; value: string; ok?: boolean; warn?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-stone-400 dark:text-[#6B6560] uppercase tracking-wider font-medium">{label}</p>
      <p className={cn(
        "text-sm font-bold font-mono",
        warn ? "text-amber-600 dark:text-amber-500" : ok ? "text-stone-900 dark:text-[#EDE9E0]" : "text-stone-600 dark:text-[#A8A29A]"
      )}>
        {value}
      </p>
    </div>
  );
}
