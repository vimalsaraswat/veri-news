"use client";

import { useInvestigation } from "@/hooks/useInvestigation";
import { InvestigationForm } from "@/components/investigation/InvestigationForm";
import { ProgressStream } from "@/components/investigation/ProgressStream";
import { VerdictCard } from "@/components/results/VerdictCard";
import { EvidenceList } from "@/components/results/EvidenceList";
import { DiagnosticsPanel } from "@/components/results/DiagnosticsPanel";
import { ExportButton } from "@/components/results/ExportButton";

export default function Home() {
  const { state, investigate, reset } = useInvestigation();

  const isIdle     = state.status === "idle";
  const isRunning  = state.status === "running";
  const isComplete = state.status === "complete";
  const isError    = state.status === "error";

  const evidenceCount =
    state.status === "running" || state.status === "complete"
      ? state.evidence.length : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="animate-fade-up">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-700 dark:text-red-500 mb-4">
          AI Fact Verification
        </p>
        <h1 className="font-serif text-4xl sm:text-[52px] font-bold text-stone-900 dark:text-[#EDE9E0] leading-[1.1] tracking-tight">
          Verify any<br />news story.
        </h1>
        <p className="mt-4 text-stone-500 dark:text-[#A8A29A] text-sm leading-relaxed max-w-[26rem]">
          Paste a headline or article. Three AI agents extract claims,
          search live evidence, and deliver a forensic verdict.
        </p>
      </div>

      {/* ── Divider ──────────────────────────────────────── */}
      <div className="border-t border-stone-200 dark:border-[#2C2924]" />

      {/* ── Input ────────────────────────────────────────── */}
      <div className={`rounded-xl transition-all duration-300 animate-fade-up delay-75 ${isRunning ? "card-raised" : "card"} p-5`}>
        <InvestigationForm onSubmit={investigate} isLoading={isRunning} onReset={reset} />
      </div>

      {/* ── Pipeline progress ─────────────────────────────── */}
      {(isRunning || isComplete) && (
        <div className="space-y-3 animate-fade-up">
          <SectionLabel text="Investigation" running={isRunning} />
          <ProgressStream
            agentTokens={
              state.status === "running" || state.status === "complete"
                ? state.agentTokens : {}
            }
            currentAgent={isRunning ? state.currentAgent : "done"}
            isComplete={isComplete}
            evidenceCount={evidenceCount}
          />
        </div>
      )}

      {/* ── Results ──────────────────────────────────────── */}
      {isComplete && (
        <div className="space-y-6 animate-fade-up">
          <SectionLabel text="Verdict" />
          <VerdictCard verdict={state.verdict} />

          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <DiagnosticsPanel diagnostics={state.diagnostics} />
            </div>
            <ExportButton
              verdict={state.verdict}
              evidence={state.evidence}
              related={state.related}
              diagnostics={state.diagnostics}
              reportText={state.agentTokens["reasoning_verdict"] ?? ""}
            />
          </div>

          <EvidenceList items={state.evidence} title="Evidence Sources" />
          {state.related.length > 0 && (
            <EvidenceList items={state.related} title="Related Coverage" initialVisible={4} />
          )}
        </div>
      )}

      {/* ── Error ────────────────────────────────────────── */}
      {isError && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-5 animate-fade-up">
          <div className="flex gap-3 items-start">
            <svg className="w-4 h-4 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-400">Investigation failed</p>
              <p className="text-sm text-red-700/70 dark:text-red-500/70 mt-1">{state.message}</p>
              <button
                onClick={reset}
                className="mt-2.5 text-xs font-semibold text-red-700 dark:text-red-500 hover:text-red-900 dark:hover:text-red-400 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Idle hint ─────────────────────────────────────── */}
      {isIdle && (
        <p className="text-[11px] text-stone-400 dark:text-[#6B6560] animate-fade-in delay-300">
          Try: paste a news headline, a tweet, or a factual claim
        </p>
      )}

    </div>
  );
}

function SectionLabel({ text, running }: { text: string; running?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 dark:text-[#6B6560]">{text}</span>
      {running && (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 dark:text-red-500">
          <span className="w-1 h-1 rounded-full bg-red-600 dark:bg-red-500 animate-pulse" />
          running
        </span>
      )}
    </div>
  );
}
