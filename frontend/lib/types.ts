export interface EvidenceItem {
  claim: string;
  title: string;
  url: string;
  domain: string;
  content: string;
  score: number;
  relevance: number;
  credibility: number;
  published_date: string | null;
  fallback_level: number;
}

export interface DiagnosticsPayload {
  detected_geography: string | null;
  geography_confidence: number;
  claims_extracted: number;
  claims_with_evidence: number;
  low_relevance_ratio: number;
  evidence_count: number;
  search_errors: string[];
}

export type VerdictType = "Real" | "Fake" | "Suspicious" | "Inconclusive";
export type ConfidenceLabel = "High" | "Medium" | "Low";

export interface VerdictPayload {
  verdict: VerdictType;
  confidence: number;
  confidence_label: ConfidenceLabel;
  summary: string;
  corroborating_count: number;
  contradicting_count: number;
  claim_verification_rate: number;
}

export type SSEEventType =
  | "connected"
  | "agent_start"
  | "token"
  | "evidence"
  | "related_articles"
  | "diagnostics"
  | "verdict"
  | "done"
  | "error";

export interface SSEAgentStartData {
  agent: string;
  label: string;
}

export interface SSETokenData {
  text: string;
  agent: string;
}

export type AgentName =
  | "content_analysis"
  | "source_credibility"
  | "reasoning_verdict";

export const AGENT_LABELS: Record<AgentName, string> = {
  content_analysis: "Content Analyst",
  source_credibility: "Research Agent",
  reasoning_verdict: "Forensic Judge",
};
