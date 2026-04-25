"use client";

import { useCallback, useState } from "react";
import { useSSEStream } from "./useSSE";
import type {
  DiagnosticsPayload,
  EvidenceItem,
  VerdictPayload,
  SSEAgentStartData,
  SSETokenData,
} from "@/lib/types";

type InvestigationStatus =
  | { status: "idle" }
  | {
      status: "running";
      currentAgent: string;
      currentAgentLabel: string;
      agentTokens: Record<string, string>;
      evidence: EvidenceItem[];
    }
  | {
      status: "complete";
      verdict: VerdictPayload;
      evidence: EvidenceItem[];
      related: EvidenceItem[];
      diagnostics: DiagnosticsPayload;
      agentTokens: Record<string, string>;
    }
  | { status: "error"; message: string };

export type { InvestigationStatus };

export function useInvestigation() {
  const [state, setState] = useState<InvestigationStatus>({ status: "idle" });
  const { stream, abort } = useSSEStream();

  const investigate = useCallback(
    async (text: string) => {
      const agentTokens: Record<string, string> = {};

      setState({
        status: "running",
        currentAgent: "content_analysis",
        currentAgentLabel: "Content Analyst",
        agentTokens,
        evidence: [],
      });

      await stream(text, (evt) => {
        switch (evt.event) {
          case "agent_start": {
            const d = evt.data as SSEAgentStartData;
            setState((prev) =>
              prev.status === "running"
                ? { ...prev, currentAgent: d.agent, currentAgentLabel: d.label }
                : prev
            );
            break;
          }

          case "token": {
            const d = evt.data as SSETokenData;
            agentTokens[d.agent] = (agentTokens[d.agent] ?? "") + d.text;
            setState((prev) =>
              prev.status === "running"
                ? { ...prev, agentTokens: { ...agentTokens } }
                : prev
            );
            break;
          }

          case "evidence": {
            const items = (evt.data as { items: EvidenceItem[] }).items;
            setState((prev) =>
              prev.status === "running"
                ? { ...prev, evidence: items }
                : prev
            );
            break;
          }

          case "diagnostics": {
            const diag = evt.data as DiagnosticsPayload;
            setState((prev) => {
              if (prev.status !== "running") return prev;
              return { ...prev, _diagnostics: diag } as typeof prev & { _diagnostics: DiagnosticsPayload };
            });
            // Store for complete transition
            (agentTokens as Record<string, unknown>).__diagnostics = diag;
            break;
          }

          case "related_articles": {
            const items = (evt.data as { items: EvidenceItem[] }).items;
            (agentTokens as Record<string, unknown>).__related = items;
            break;
          }

          case "verdict": {
            const verdict = evt.data as VerdictPayload;
            const diagnostics = (agentTokens as Record<string, unknown>).__diagnostics as DiagnosticsPayload ?? {
              detected_geography: null,
              geography_confidence: 0,
              claims_extracted: 0,
              claims_with_evidence: 0,
              low_relevance_ratio: 0,
              evidence_count: 0,
              search_errors: [],
            };
            const related = ((agentTokens as Record<string, unknown>).__related as EvidenceItem[]) ?? [];

            setState((prev) => ({
              status: "complete",
              verdict,
              evidence: prev.status === "running" ? prev.evidence : [],
              related,
              diagnostics,
              agentTokens: { ...agentTokens },
            }));
            break;
          }

          case "error": {
            const d = evt.data as { message: string };
            setState({ status: "error", message: d.message ?? "Unknown error occurred." });
            break;
          }
        }
      });
    },
    [stream]
  );

  const reset = useCallback(() => {
    abort();
    setState({ status: "idle" });
  }, [abort]);

  return { state, investigate, reset };
}
