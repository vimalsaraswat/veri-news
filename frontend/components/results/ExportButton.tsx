"use client";

import type { VerdictPayload, EvidenceItem, DiagnosticsPayload } from "@/lib/types";

interface ExportButtonProps {
  verdict: VerdictPayload;
  evidence: EvidenceItem[];
  related: EvidenceItem[];
  diagnostics: DiagnosticsPayload;
  reportText: string;
}

export function ExportButton({ verdict, evidence, related, diagnostics, reportText }: ExportButtonProps) {
  function handleExport() {
    const blob = new Blob(
      [JSON.stringify({ timestamp: new Date().toISOString(), verdict, diagnostics, evidence, related_articles: related, report: reportText }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verinews-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-[#6B6560] hover:text-stone-800 dark:hover:text-[#EDE9E0] border border-stone-200 dark:border-[#2C2924] hover:border-stone-300 dark:hover:border-[#3A3630] rounded-lg px-3.5 py-2 bg-white dark:bg-[#1D1B17] transition-all duration-150"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Export JSON
    </button>
  );
}
