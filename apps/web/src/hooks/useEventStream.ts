"use client";

import { useCallback, useRef } from "react";

export interface StageStreamEvent {
  type: string;
  stageNumber?: number;
  stageName?: string;
  durationMs?: number;
  data?: Record<string, any>;
  boxesTouched?: string[];
  tokenChunk?: string;
}

export interface AskStreamRequest {
  q: string;
  isHomePreset?: boolean;
  sessionId?: string;
}

export interface StreamOptions {
  onEvent?: (event: StageStreamEvent) => void;
  onError?: (err: Error) => void;
  onComplete?: () => void;
}

export function useEventStream() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const streamAsk = useCallback(
    async (
      request: AskStreamRequest,
      options: StreamOptions = {}
    ): Promise<boolean> => {
      abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      try {
        const response = await fetch(`${apiUrl}/ask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        if (!response.ok && response.status !== 429) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("No readable response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const block of parts) {
            const lines = block.split("\n");
            let eventName = "message";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataStr += (dataStr ? "\n" : "") + line.slice(5).trim();
              }
            }

            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                const event: StageStreamEvent = {
                  type: eventName !== "message" ? eventName : parsed.type || "message",
                  stageNumber: parsed.stageNumber,
                  stageName: parsed.stageName,
                  durationMs: parsed.durationMs,
                  data: parsed.data,
                  boxesTouched: parsed.boxesTouched,
                  tokenChunk: parsed.tokenChunk,
                };
                options.onEvent?.(event);
              } catch {
                options.onEvent?.({
                  type: eventName,
                  tokenChunk: dataStr,
                });
              }
            }
          }
        }

        options.onComplete?.();
        return true;
      } catch (err: any) {
        if (err.name === "AbortError") {
          return false;
        }
        options.onError?.(err);
        return false;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [abort]
  );

  return {
    streamAsk,
    abort,
  };
}
