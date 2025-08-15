import { LLMRequest } from "@/types/llm";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function callLLM(request: LLMRequest): Promise<{ sql: string }> {
  const response = await fetch(`${BACKEND_URL}/api/call-llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "调用 LLM 服务失败");
  }

  return response.json();
}
