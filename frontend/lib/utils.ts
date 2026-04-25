import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { VerdictType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VERDICT_COLORS: Record<VerdictType, string> = {
  Real: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Fake: "text-red-600 bg-red-50 border-red-200",
  Suspicious: "text-amber-600 bg-amber-50 border-amber-200",
  Inconclusive: "text-slate-600 bg-slate-50 border-slate-200",
};

export const VERDICT_BADGE_COLORS: Record<VerdictType, string> = {
  Real: "bg-emerald-600",
  Fake: "bg-red-600",
  Suspicious: "bg-amber-500",
  Inconclusive: "bg-slate-500",
};

export const VERDICT_ICONS: Record<VerdictType, string> = {
  Real: "✓",
  Fake: "✗",
  Suspicious: "?",
  Inconclusive: "–",
};

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
