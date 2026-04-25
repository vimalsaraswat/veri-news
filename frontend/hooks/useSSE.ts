"use client";

import { useCallback, useRef } from "react";
import type { SSEEventType } from "@/lib/types";

export interface ParsedSSEEvent {
  event: SSEEventType;
  data: unknown;
}

type SSEHandler = (event: ParsedSSEEvent) => void;

function parseSSEChunk(chunk: string): ParsedSSEEvent[] {
  const events: ParsedSSEEvent[] = [];
  const blocks = chunk.split("\n\n");

  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split("\n");
    let eventType: SSEEventType = "token";
    let dataLine = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim() as SSEEventType;
      } else if (line.startsWith("data: ")) {
        dataLine = line.slice(6).trim();
      }
    }

    if (dataLine) {
      try {
        events.push({ event: eventType, data: JSON.parse(dataLine) });
      } catch {
        events.push({ event: eventType, data: dataLine });
      }
    }
  }

  return events;
}

export function useSSEStream() {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (text: string, onEvent: SSEHandler) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/investigate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          onEvent({
            event: "error",
            data: { message: errBody?.detail ?? `HTTP ${res.status}`, code: "HTTP_ERROR" },
          });
          return;
        }

        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lastNewline = buffer.lastIndexOf("\n\n");
          if (lastNewline === -1) continue;

          const complete = buffer.slice(0, lastNewline + 2);
          buffer = buffer.slice(lastNewline + 2);

          for (const evt of parseSSEChunk(complete)) {
            onEvent(evt);
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        onEvent({
          event: "error",
          data: { message: String(err), code: "FETCH_ERROR" },
        });
      }
    },
    []
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { stream, abort };
}
