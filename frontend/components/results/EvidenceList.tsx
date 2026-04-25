"use client";

import { useState } from "react";
import { SourceCard } from "./SourceCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import type { EvidenceItem } from "@/lib/types";

interface EvidenceListProps {
  items: EvidenceItem[];
  title?: string;
  initialVisible?: number;
  isLoading?: boolean;
}

export function EvidenceList({
  items,
  title = "Sources",
  initialVisible = 6,
  isLoading = false,
}: EvidenceListProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, initialVisible);
  const hidden = items.length - initialVisible;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SectionHeader title={title} count={0} />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <SectionHeader title={title} count={items.length} />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {visible.map((item, i) => (
          <div
            key={item.url}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}
          >
            <SourceCard item={item} />
          </div>
        ))}
      </div>

      {!showAll && hidden > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2.5 text-xs font-semibold text-stone-500 dark:text-[#6B6560] hover:text-stone-700 dark:hover:text-[#A8A29A] border border-dashed border-stone-200 dark:border-[#2C2924] hover:border-stone-300 dark:hover:border-[#3A3630] rounded-lg transition-all"
        >
          Show {hidden} more source{hidden !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-[#6B6560]">{title}</h3>
      {count > 0 && (
        <span className="text-[10px] text-stone-400 dark:text-[#6B6560] font-mono bg-stone-100 dark:bg-[#252219] border border-stone-200 dark:border-[#3A3630] px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}
