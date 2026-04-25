"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface InvestigationFormProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  onReset?: () => void;
}

const MAX = 15000;
const MIN = 10;

export function InvestigationForm({ onSubmit, isLoading, onReset }: InvestigationFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const len = text.length;
  const overLimit = len > MAX;
  const canSubmit = !isLoading && !overLimit && text.trim().length >= MIN;
  const pct = Math.min(100, Math.round((len / MAX) * 100));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < MIN)  { setError("Enter at least 10 characters."); return; }
    if (trimmed.length > MAX)  { setError(`Exceeds ${MAX.toLocaleString()} character limit.`); return; }
    setError(null);
    onSubmit(trimmed);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    if (error) setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={handleChange}
          disabled={isLoading}
          rows={7}
          placeholder="Paste a news headline, article, or factual claim to investigate…"
          className={cn(
            "w-full resize-none rounded-lg px-4 py-3.5 pb-9",
            "text-sm text-stone-900 dark:text-[#EDE9E0]",
            "bg-stone-50 dark:bg-[#1D1B17]",
            "placeholder:text-stone-400 dark:placeholder:text-[#6B6560]",
            "focus:outline-none focus:ring-0 transition-colors duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            overLimit
              ? "border border-red-400 dark:border-red-700/60"
              : "border border-stone-200 dark:border-[#2C2924] focus:border-stone-400 dark:focus:border-[#6B6560]"
          )}
        />

        {/* Char count row */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex-1 max-w-24 h-px bg-stone-200 dark:bg-[#2C2924] mr-3">
            <div
              className={cn(
                "h-full transition-all duration-300",
                overLimit ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-stone-400"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={cn(
            "text-[11px] font-mono tabular-nums",
            overLimit ? "text-red-500" : "text-stone-400 dark:text-[#6B6560]"
          )}>
            {len.toLocaleString()} / {MAX.toLocaleString()}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-700 dark:text-red-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-2.5">
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "flex-1 py-2.5 px-5 rounded-lg text-sm font-semibold transition-all duration-150",
            "bg-stone-900 dark:bg-[#EDE9E0] text-white dark:text-[#141210]",
            "hover:bg-stone-800 dark:hover:bg-white",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            isLoading && "cursor-wait"
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-[1.5px] border-current/30 border-t-current rounded-full animate-spin" />
              Investigating…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Investigate
            </span>
          )}
        </button>

        {(isLoading || len > 0) && (
          <button
            type="button"
            onClick={() => { setText(""); setError(null); onReset?.(); }}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-500 dark:text-[#6B6560] border border-stone-200 dark:border-[#2C2924] hover:bg-stone-50 dark:hover:bg-[#1D1B17] hover:text-stone-700 dark:hover:text-[#EDE9E0] transition-all"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
