"use client";

import { useEffect, useRef } from "react";
import { AgentPhaseHeader, type AgentStatus } from "./AgentPhaseHeader";
import { Markdown } from "@/components/ui/Markdown";
import { cn } from "@/lib/utils";

interface ProgressStreamProps {
  agentTokens: Record<string, string>;
  currentAgent: string;
  isComplete: boolean;
  evidenceCount: number;
}

function agentStatus(key: string, currentAgent: string, isComplete: boolean, tokens: string): AgentStatus {
  if (isComplete) return "complete";
  if (currentAgent === key) return "running";
  if (tokens.length > 0) return "complete";
  return "pending";
}

function parseClaims(raw: string): { claims: string[]; noVerifiable: boolean } {
  const text = raw.trim();
  if (!text) return { claims: [], noVerifiable: false };
  if (text.includes("NO_VERIFIABLE_CLAIMS")) return { claims: [], noVerifiable: true };
  const claims = text
    .split("\n")
    .map((l) => l.replace(/^[\s\-•*·\d.]+/, "").trim())
    .filter((l) => l.length > 8);
  return { claims, noVerifiable: false };
}

/* ── Content Analyst Panel ──────────────────────────────────── */

function ContentAnalystPanel({ tokens, status }: { tokens: string; status: AgentStatus }) {
  const { claims, noVerifiable } = parseClaims(tokens);
  const hasOutput = tokens.length > 0;

  return (
    <div className="mt-4 space-y-3">
      {status === "running" && !hasOutput && (
        <div className="flex items-center gap-2.5 text-sm text-stone-500 dark:text-[#A8A29A]">
          <span className="flex gap-1">
            {[0, 120, 240].map((d) => (
              <span
                key={d}
                className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-[#6B6560] animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </span>
          Reading article…
        </div>
      )}

      {noVerifiable && (
        <div className="flex gap-3 items-start bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3.5 animate-fade-in">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">No distinct verifiable claims found</p>
            <p className="text-xs text-amber-700/70 dark:text-amber-500/70 mt-0.5 leading-relaxed">
              The text doesn&apos;t contain clearly verifiable factual claims. The investigation will proceed using the full article as context.
            </p>
          </div>
        </div>
      )}

      {claims.length > 0 && (
        <div className="space-y-1.5 animate-fade-in">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-[#6B6560]">
            {claims.length} claim{claims.length !== 1 ? "s" : ""} identified
          </p>
          {claims.map((claim, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 bg-stone-50 dark:bg-[#1D1B17] border border-stone-200 dark:border-[#2C2924] animate-slide-right"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-[10px] font-bold text-stone-400 dark:text-[#6B6560] mt-0.5 w-3.5 flex-shrink-0 font-mono">{i + 1}</span>
              <span className="text-sm text-stone-700 dark:text-[#A8A29A] leading-snug">{claim}</span>
            </div>
          ))}
        </div>
      )}

      {status === "running" && hasOutput && claims.length === 0 && !noVerifiable && (
        <p className="text-sm text-stone-400 dark:text-[#6B6560] animate-pulse">Extracting claims…</p>
      )}
    </div>
  );
}

/* ── Research Agent Panel ───────────────────────────────────── */

function ResearchAgentPanel({ status, evidenceCount }: { status: AgentStatus; evidenceCount: number }) {
  return (
    <div className="mt-4">
      {status === "running" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-sm text-stone-500 dark:text-[#A8A29A]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 dark:bg-[#6B6560] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-stone-500 dark:bg-[#A8A29A]" />
            </span>
            Querying trusted news databases for evidence…
          </div>
          {evidenceCount > 0 && (
            <div className="flex items-center gap-2 text-sm animate-fade-in">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{evidenceCount}</span>
              <span className="text-stone-500 dark:text-[#A8A29A]">source{evidenceCount !== 1 ? "s" : ""} found so far</span>
            </div>
          )}
        </div>
      )}

      {status === "complete" && (
        <div className="flex items-center gap-2 mt-4 animate-fade-in">
          <svg className="w-4 h-4 text-stone-300 dark:text-[#3A3630]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
          </svg>
          <span className="text-sm font-bold text-stone-800 dark:text-[#EDE9E0] font-mono">{evidenceCount}</span>
          <span className="text-sm text-stone-500 dark:text-[#A8A29A]">sources analysed</span>
        </div>
      )}
    </div>
  );
}

/* ── Forensic Judge Panel ───────────────────────────────────── */

function ForensicJudgePanel({ tokens, status }: { tokens: string; status: AgentStatus }) {
  const hasOutput = tokens.trim().length > 0;
  const streaming = status === "running";

  return (
    <div className="mt-4">
      {streaming && !hasOutput && (
        <div className="flex items-center gap-2.5 text-sm text-stone-500 dark:text-[#A8A29A]">
          <span className="flex gap-1">
            {[0, 120, 240].map((d) => (
              <span
                key={d}
                className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-[#6B6560] animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </span>
          Formulating verdict…
        </div>
      )}
      {hasOutput && (
        <div className="rounded-lg bg-stone-50 dark:bg-[#1D1B17] border border-stone-200 dark:border-[#2C2924] px-4 py-3.5 max-h-72 overflow-y-auto">
          <Markdown streaming={streaming}>{tokens}</Markdown>
        </div>
      )}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────── */

const AGENTS = [
  { key: "content_analysis",   label: "Content Analyst",  subtitle: "Reading article · Extracting verifiable claims",     step: 1 },
  { key: "source_credibility", label: "Research Agent",   subtitle: "Querying global news databases · Gathering evidence", step: 2 },
  { key: "reasoning_verdict",  label: "Forensic Judge",   subtitle: "Weighing evidence · Delivering independent verdict",  step: 3 },
] as const;

export function ProgressStream({ agentTokens, currentAgent, isComplete, evidenceCount }: ProgressStreamProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentAgent]);

  const currentIdx = AGENTS.findIndex((a) => a.key === currentAgent);

  return (
    <div className="relative space-y-2">
      {/* Vertical connector */}
      <div
        className="absolute left-[15px] top-10 bottom-10 w-px bg-gradient-to-b from-stone-300 dark:from-[#3A3630] via-stone-200 dark:via-[#2C2924] to-transparent pointer-events-none"
        aria-hidden
      />

      {AGENTS.map(({ key, label, subtitle, step }, idx) => {
        const tokens = agentTokens[key] ?? "";
        const status = agentStatus(key, currentAgent, isComplete, tokens);

        if (status === "pending" && idx > currentIdx + 1) return null;

        const isActive = status === "running";

        return (
          <div
            key={key}
            ref={isActive ? activeRef : undefined}
            className={cn(
              "relative rounded-xl p-5 transition-all duration-300",
              isActive
                ? "card-raised"
                : status === "complete"
                ? "card"
                : "border border-stone-200 dark:border-[#2C2924] bg-stone-50/50 dark:bg-[#1D1B17]/30 opacity-60"
            )}
          >
            <AgentPhaseHeader step={step} label={label} subtitle={subtitle} status={status} />

            {key === "content_analysis"   && <ContentAnalystPanel tokens={tokens} status={status} />}
            {key === "source_credibility" && <ResearchAgentPanel  status={status} evidenceCount={evidenceCount} />}
            {key === "reasoning_verdict"  && <ForensicJudgePanel  tokens={tokens} status={status} />}
          </div>
        );
      })}
    </div>
  );
}
