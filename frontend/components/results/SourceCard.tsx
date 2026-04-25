import { cn, truncate } from "@/lib/utils";
import type { EvidenceItem } from "@/lib/types";

function RelevanceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 55 ? "bg-emerald-500" : pct >= 28 ? "bg-amber-500" : "bg-stone-300 dark:bg-[#3A3630]";
  return (
    <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-[#6B6560]">
      <span className="w-12 shrink-0 font-medium uppercase tracking-wider">Relevance</span>
      <div className="flex-1 h-px bg-stone-200 dark:bg-[#2C2924]">
        <div
          className={cn("h-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right font-mono tabular-nums">{pct}%</span>
    </div>
  );
}

function CredBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const cls =
    pct >= 70 ? "text-emerald-700 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800" :
    pct >= 55 ? "text-stone-700   dark:text-[#A8A29A]   bg-stone-100   dark:bg-[#252219]          border-stone-200   dark:border-[#3A3630]" :
                "text-stone-500   dark:text-[#6B6560]   bg-stone-50    dark:bg-[#1D1B17]           border-stone-200   dark:border-[#2C2924]";
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-semibold font-mono", cls)}>
      {pct}%
    </span>
  );
}

export function SourceCard({ item }: { item: EvidenceItem }) {
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg card p-4 space-y-3 hover:border-stone-300 dark:hover:border-[#3A3630] transition-all duration-150 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl}
          alt=""
          width={14}
          height={14}
          className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-80 transition-opacity"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 dark:text-[#EDE9E0] line-clamp-2 leading-snug">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] text-stone-400 dark:text-[#6B6560] font-mono">{item.domain}</span>
            {item.fallback_level > 0 && (
              <span className="text-[10px] text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded font-medium">
                broader search
              </span>
            )}
            <CredBadge value={item.credibility} />
          </div>
        </div>
      </div>

      {/* Snippet */}
      {item.content && (
        <p className="text-xs text-stone-500 dark:text-[#6B6560] leading-relaxed line-clamp-3">
          {truncate(item.content, 220)}
        </p>
      )}

      <RelevanceBar value={item.relevance} />
    </a>
  );
}
