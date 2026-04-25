"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  variant?: "block" | "inline";
  className?: string;
  streaming?: boolean;
}

export function Markdown({ children, className, streaming = false }: MarkdownProps) {
  return (
    <div className={cn(streaming && "streaming-cursor", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif text-base font-bold text-stone-900 dark:text-[#EDE9E0] mt-5 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-[#A8A29A] mt-5 mb-2 pb-1 border-b border-stone-200 dark:border-[#2C2924] first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-stone-800 dark:text-[#EDE9E0] mt-3 mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-stone-600 dark:text-[#A8A29A] leading-relaxed my-1.5">{children}</p>
          ),
          ul: ({ children }) => <ul className="my-2 space-y-1 pl-0">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 space-y-1 pl-4 list-decimal">{children}</ol>,
          li: ({ children }) => (
            <li className="flex gap-2 text-sm text-stone-600 dark:text-[#A8A29A] leading-relaxed">
              <span className="mt-2 w-1 h-1 rounded-full bg-stone-400 dark:bg-[#6B6560] flex-shrink-0" />
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-stone-800 dark:text-[#EDE9E0]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-stone-600 dark:text-[#A8A29A]">{children}</em>
          ),
          code: ({ children, className: cls }) => {
            const isBlock = cls?.includes("language-");
            return isBlock ? (
              <code className="block bg-stone-50 dark:bg-[#1D1B17] text-stone-700 dark:text-[#A8A29A] text-xs font-mono rounded-lg px-3 py-2 my-2 overflow-x-auto border border-stone-200 dark:border-[#2C2924]">
                {children}
              </code>
            ) : (
              <code className="bg-stone-100 dark:bg-[#252219] text-stone-700 dark:text-[#A8A29A] text-xs font-mono rounded px-1.5 py-0.5">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-stone-300 dark:border-[#3A3630] pl-3 my-2 text-stone-500 dark:text-[#6B6560] italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-stone-200 dark:border-[#2C2924] my-3" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="text-left px-2 py-1.5 border border-stone-200 dark:border-[#2C2924] bg-stone-50 dark:bg-[#1D1B17] font-semibold text-stone-600 dark:text-[#A8A29A]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 border border-stone-100 dark:border-[#2C2924] text-stone-500 dark:text-[#6B6560]">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-700 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
