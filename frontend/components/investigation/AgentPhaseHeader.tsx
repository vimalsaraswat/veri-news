import { cn } from "@/lib/utils";

export type AgentStatus = "pending" | "running" | "complete";

interface AgentPhaseHeaderProps {
  step: number;
  label: string;
  subtitle: string;
  status: AgentStatus;
}

export function AgentPhaseHeader({ step, label, subtitle, status }: AgentPhaseHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      {/* Step indicator */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 border",
        status === "running"  && "bg-stone-900 dark:bg-[#EDE9E0] border-stone-900 dark:border-[#EDE9E0] text-white dark:text-[#141210]",
        status === "complete" && "bg-emerald-500 border-emerald-500 text-white",
        status === "pending"  && "bg-transparent border-stone-300 dark:border-[#3A3630] text-stone-400 dark:text-[#6B6560]"
      )}>
        {status === "complete" ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-[11px] font-bold font-mono">
            {String(step).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "text-sm font-semibold transition-colors",
            status === "pending"
              ? "text-stone-400 dark:text-[#6B6560]"
              : "text-stone-900 dark:text-[#EDE9E0]"
          )}>
            {label}
          </span>

          {status === "running" && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 dark:text-[#A8A29A]">
              <span className="w-1 h-1 rounded-full bg-stone-400 dark:bg-[#A8A29A] animate-pulse" />
              Running
            </span>
          )}
          {status === "complete" && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500">
              Done
            </span>
          )}
        </div>
        <p className={cn(
          "text-[11px] mt-0.5",
          status === "pending"
            ? "text-stone-400 dark:text-[#6B6560]"
            : "text-stone-500 dark:text-[#A8A29A]"
        )}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
