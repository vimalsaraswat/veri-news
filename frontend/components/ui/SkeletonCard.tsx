import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg card p-4 animate-pulse", className)}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-3.5 h-3.5 rounded bg-stone-200 dark:bg-[#2C2924]" />
        <div className="h-3 bg-stone-200 dark:bg-[#2C2924] rounded w-28" />
        <div className="ml-auto h-3 bg-stone-100 dark:bg-[#252219] rounded w-10" />
      </div>
      <div className="h-3 bg-stone-200 dark:bg-[#2C2924] rounded w-3/4 mb-2" />
      <div className="h-2.5 bg-stone-100 dark:bg-[#252219] rounded w-full mb-1.5" />
      <div className="h-2.5 bg-stone-100 dark:bg-[#252219] rounded w-5/6" />
    </div>
  );
}
