import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  variant?: "success" | "danger" | "warning" | "neutral" | "info";
  size?: "sm" | "md";
  className?: string;
}

const VARIANT_CLASSES = {
  success: "bg-emerald-50  dark:bg-emerald-900/30  text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800",
  danger:  "bg-red-50      dark:bg-red-950/30      text-red-700     dark:text-red-500     border-red-200     dark:border-red-900/50",
  warning: "bg-amber-50    dark:bg-amber-900/20    text-amber-700   dark:text-amber-500   border-amber-200   dark:border-amber-800/50",
  neutral: "bg-stone-100   dark:bg-[#252219]       text-stone-600   dark:text-[#A8A29A]   border-stone-200   dark:border-[#3A3630]",
  info:    "bg-stone-100   dark:bg-[#252219]       text-stone-700   dark:text-[#EDE9E0]   border-stone-200   dark:border-[#3A3630]",
};

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function StatusBadge({
  label,
  variant = "neutral",
  size = "sm",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
    >
      {label}
    </span>
  );
}
