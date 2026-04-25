"use client";

import { cn } from "@/lib/utils";
import type { VerdictPayload, VerdictType } from "@/lib/types";
import { ConfidenceGauge } from "./ConfidenceGauge";
import { Markdown } from "@/components/ui/Markdown";

const CFG: Record<VerdictType, {
  accent: string;
  headline: string;
  headlineColor: string;
  chipColor: string;
  icon: React.ReactNode;
}> = {
  Real: {
    accent:       "border-l-emerald-500",
    headline:     "Verified Real",
    headlineColor:"text-emerald-700 dark:text-emerald-500",
    chipColor:    "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Fake: {
    accent:       "border-l-red-600",
    headline:     "Likely Fake",
    headlineColor:"text-red-700 dark:text-red-500",
    chipColor:    "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Suspicious: {
    accent:       "border-l-amber-500",
    headline:     "Suspicious",
    headlineColor:"text-amber-700 dark:text-amber-500",
    chipColor:    "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  Inconclusive: {
    accent:       "border-l-stone-400",
    headline:     "Inconclusive",
    headlineColor:"text-stone-600 dark:text-stone-400",
    chipColor:    "text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
      </svg>
    ),
  },
};

export function VerdictCard({ verdict }: { verdict: VerdictPayload }) {
  const c = CFG[verdict.verdict];

  return (
    <div className={cn("card rounded-xl overflow-hidden animate-scale-in border-l-4", c.accent)}>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 dark:text-[#6B6560] mb-1.5">
              Forensic Verdict
            </p>
            <h2 className={cn("font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-none", c.headlineColor)}>
              {c.headline}
            </h2>
          </div>

          {/* Counts */}
          <div className="flex items-center gap-4 pt-1">
            <CountStat value={verdict.corroborating_count} label="Corroborate" color="text-emerald-600 dark:text-emerald-400" />
            <div className="w-px h-8 bg-stone-200 dark:bg-[#2C2924]" />
            <CountStat value={verdict.contradicting_count} label="Contradict" color="text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Summary */}
        <div className="text-stone-600 dark:text-[#A8A29A] text-sm leading-relaxed">
          <Markdown>{verdict.summary}</Markdown>
        </div>

        <div className="border-t border-stone-100 dark:border-[#2C2924]" />

        {/* Confidence */}
        <div className="space-y-2.5">
          <ConfidenceGauge confidence={verdict.confidence} label={verdict.confidence_label} />
          <p className="text-[11px] text-stone-400 dark:text-[#6B6560] font-mono">
            Claim coverage:{" "}
            <span className="text-stone-700 dark:text-[#A8A29A]">{Math.round(verdict.claim_verification_rate * 100)}%</span>
            {" "}of extracted claims had corroborating evidence
          </p>
        </div>

      </div>
    </div>
  );
}

function CountStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-2xl font-bold font-mono leading-none", color)}>{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-400 dark:text-[#6B6560] mt-1">{label}</p>
    </div>
  );
}
