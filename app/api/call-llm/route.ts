import { NextRequest, NextResponse } from "next/server";
import {
  createOpenAIClient,
  createGeminiClient,
  buildSqlPrompt,
} from "@/lib/llm-clients";
import { LLMModelType } from "@/types/llm";

/**
 * 创建错误响应
 */
const createErrorResponse = (code: string, message: string, status = 400) => {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
};

/**
 * 错误处理包装器
 */
const withErrorHandling = (
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error: any) {
      console.error("API Error:", error);
      return createErrorResponse(
        "INTERNAL_SERVER_ERROR",
        error.message || "处理请求时发生错误",
        500
      );
    }
  };
};

/**
 * 处理POST请求
 */
async function handlePost(req: NextRequest) {
  const { userInput, modelType } = await req.json();

  if (!userInput) {
    return createErrorResponse("INVALID_REQUEST", "缺少用户输入");
  }

  if (!modelType) {
    return createErrorResponse("INVALID_REQUEST", "缺少模型类型");
  }

  const defaultModelType =
    (process.env.LLM_DEFAULT_PROVIDER as LLMModelType) || "openai";

  try {
    // 根据配置选择不同的 LLM 客户端
    const llmClient =
      modelType === "gemini" ? createGeminiClient() : createOpenAIClient();

    // 构建 prompt（包含 SQL 转换指令）
    const prompt = buildSqlPrompt(userInput);

    // 调用 LLM
    const sqlResult = await llmClient.generate(prompt);

    return NextResponse.json({ sql: sqlResult });
  } catch (error: any) {
    console.error("LLM API Error:", error);
    return createErrorResponse("LLM_ERROR", `LLM处理错误: ${error.message}`);
  }
}

export const POST = withErrorHandling(handlePost);
