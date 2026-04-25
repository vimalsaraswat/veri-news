import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 dark:border-[#2C2924] bg-[#F7F5F0]/90 dark:bg-[#141210]/90 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">

        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-[17px] tracking-tight text-stone-900 dark:text-[#EDE9E0]">
            VeriNews
          </span>
          <span className="hidden sm:block w-px h-3.5 bg-stone-300 dark:bg-[#3A3630]" />
          <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400 dark:text-[#6B6560]">
            Fact Verification
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-stone-400 dark:text-[#6B6560]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <ThemeToggle />
        </div>

      </div>
    </header>
  );
}
