import { useState, useCallback } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface StreamResponse {
  thinking: string;
  sql: string;
  isComplete: boolean;
  // optional intent params from backend
  params?: Record<string, string>;
}

interface UseLLMStreamReturn {
  thinking: string;
  isThinking: boolean;
  isComplete: boolean;
  generatedSql: string;
  error: string | null;
  generateSQL: (userInput: string) => Promise<void>;
  reset: () => void;
}

export function useLLMStream(): UseLLMStreamReturn {
  const [thinking, setThinking] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [generatedSql, setGeneratedSql] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setThinking("");
    setIsThinking(false);
    setIsComplete(false);
    setGeneratedSql("");
    setError(null);
  }, []);

  const generateSQL = useCallback(
    async (userInput: string) => {
      reset();
      setIsThinking(true);

      try {
        const response = await fetch(`${BACKEND_URL}/api/call-llm-stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userInput,
          }),
        });

        if (!response.ok) {
          throw new Error("API 请求失败");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("无法获取响应流");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                try {
                  const parsed: StreamResponse = JSON.parse(data);

                  setThinking(parsed.thinking || "");

                  if (parsed.sql) {
                    setGeneratedSql(parsed.sql);
                  }

                  if (parsed.isComplete) {
                    setIsThinking(false);
                    setIsComplete(true);
                  }
                } catch (e) {
                  console.error("解析响应数据失败:", e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (err: any) {
        console.error("处理用户输入失败:", err);
        setIsThinking(false);
        setError(err.message || "处理请求时发生错误");
      }
    },
    [reset]
  );

  return {
    thinking,
    isThinking,
    isComplete,
    generatedSql,
    error,
    generateSQL,
    reset,
  };
}
