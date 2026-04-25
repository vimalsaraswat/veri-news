"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ConfidenceLabel } from "@/lib/types";

const TRACK: Record<ConfidenceLabel, string> = {
  High:   "from-emerald-500 to-emerald-400",
  Medium: "from-amber-500   to-amber-400",
  Low:    "from-red-600     to-red-500",
};

const LABEL_COLOR: Record<ConfidenceLabel, string> = {
  High:   "text-emerald-700 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
  Medium: "text-amber-700   dark:text-amber-500   bg-amber-50   dark:bg-amber-900/30   border-amber-200   dark:border-amber-800",
  Low:    "text-red-700     dark:text-red-500     bg-red-50     dark:bg-red-900/30     border-red-200     dark:border-red-800",
};

export function ConfidenceGauge({ confidence, label }: { confidence: number; label: ConfidenceLabel }) {
  const [width, setWidth] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (!animated.current) {
      animated.current = true;
      requestAnimationFrame(() => setWidth(Math.round(confidence * 100)));
    }
  }, [confidence]);

  const pct = Math.round(confidence * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-[#6B6560]">Confidence</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-stone-900 dark:text-[#EDE9E0] font-mono tabular-nums">{pct}%</span>
          <span className={cn(
            "text-[10px] font-bold border rounded-full px-2 py-0.5 uppercase tracking-wide",
            LABEL_COLOR[label]
          )}>
            {label}
          </span>
        </div>
      </div>

      <div className="h-1 w-full rounded-full bg-stone-200 dark:bg-[#2C2924] overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out", TRACK[label])}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
