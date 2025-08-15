import { NextRequest } from "next/server";
import { dbSchema, sqlPrompt } from "@/lib/doc";

/**
 * 创建流式响应的 Gemini 客户端
 */
function createStreamingGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint =
    process.env.GEMINI_ENDPOINT ||
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  if (!apiKey) {
    throw new Error("未配置Gemini API密钥。请在环境变量中设置GEMINI_API_KEY。");
  }

  return {
    generateStream: async function* (prompt: string) {
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API call failed: ${error}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (content) {
        // 模拟流式响应，将内容分块返回
        const chunks = content.split("");
        for (const chunk of chunks) {
          yield chunk;
          // 添加小延迟以模拟流式效果
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    },
  };
}

/**
 * 创建流式响应的 OpenAI 客户端
 */
function createStreamingOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  const endpoint =
    process.env.OPENAI_API_ENDPOINT ||
    "https://api.openai.com/v1/chat/completions";
  const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

  if (!apiKey) {
    throw new Error("未配置OpenAI API密钥。请在环境变量中设置OPENAI_API_KEY。");
  }

  return {
    generateStream: async function* (prompt: string) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "OpenAI API call failed");
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
              if (data === "[DONE]") return;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  yield content;
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}

/**
 * 构建带思考过程的 prompt
 */
function buildThinkingPrompt(userInput: string) {
  return `
你是一个 SQL 专家，请将以下自然语言查询转换为 SQL 语句。

请按照以下格式回答：

1. 首先分析用户需求（思考过程）
2. 然后提供最终的 SQL 语句

用户需求: ${userInput}

请先分析这个需求，思考需要查询哪些表和字段，然后生成对应的 SQL 语句。

数据库表结构如下:
${dbSchema}

输出的SQL参考如下：
${sqlPrompt}

请按照以下格式回答：
思考过程：[详细分析用户需求，确定需要的表和字段]
SQL语句：[最终的PostgreSQL兼容SQL语句]
`;
}

/**
 * 处理POST请求
 */
export async function POST(req: NextRequest) {
  try {
    const { userInput } = await req.json();

    if (!userInput) {
      return new Response("缺少用户输入", { status: 400 });
    }

    const prompt = buildThinkingPrompt(userInput);

    // 根据环境变量选择LLM提供商
    const llmProvider = process.env.LLM_PROVIDER || "openai";
    const client =
      llmProvider === "gemini"
        ? createStreamingGeminiClient()
        : createStreamingOpenAIClient();

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = "";
          let thinkingPart = "";
          let sqlPart = "";
          let isInSqlSection = false;

          for await (const chunk of client.generateStream(prompt)) {
            fullResponse += chunk;

            // 检查是否进入SQL部分
            if (fullResponse.includes("SQL语句：")) {
              isInSqlSection = true;
              const parts = fullResponse.split("SQL语句：");
              thinkingPart = parts[0].replace("思考过程：", "").trim();
              sqlPart = parts[1] || "";
            } else if (!isInSqlSection) {
              thinkingPart = fullResponse.replace("思考过程：", "").trim();
            } else {
              sqlPart += chunk;
            }

            // 发送当前状态
            const data = {
              thinking: thinkingPart,
              sql: sqlPart.trim(),
              isComplete: false,
            };

            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          }

          // 发送完成状态
          const finalData = {
            thinking: thinkingPart,
            sql: sqlPart.trim(),
            isComplete: true,
          };

          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(finalData)}\n\n`)
          );
          controller.close();
        } catch (error: unknown) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("API Error:", error);
    const message =
      error instanceof Error ? error.message : "处理请求时发生错误";
    return new Response(message, { status: 500 });
  }
}
