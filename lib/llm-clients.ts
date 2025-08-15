import { OpenAIConfig, GeminiConfig } from "@/types/llm";
import { dbSchema } from "./doc";

// OpenAI 风格 API 客户端
export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  const endpoint =
    process.env.OPENAI_API_ENDPOINT ||
    "https://api.openai.com/v1/chat/completions";
  const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

  if (!apiKey) {
    throw new Error("未配置OpenAI API密钥。请在环境变量中设置OPENAI_API_KEY。");
  }

  return {
    generate: async (prompt: string): Promise<string> => {
      try {
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
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "OpenAI API call failed");
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
      } catch (error: any) {
        console.error("OpenAI API Error:", error);
        throw new Error(`OpenAI API Error: ${error.message}`);
      }
    },
  };
}

// Gemini 客户端
export function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-pro";

  if (!apiKey) {
    throw new Error("未配置Gemini API密钥。请在环境变量中设置GEMINI_API_KEY。");
  }

  return {
    generate: async (prompt: string): Promise<string> => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
              },
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Gemini API call failed");
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
      } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new Error(`Gemini API Error: ${error.message}`);
      }
    },
  };
}

// 构建 SQL 转换 prompt
export function buildSqlPrompt(userInput: string) {
  return `
    你是一个 SQL 专家，请将以下自然语言查询转换为 SQL 语句：
    
    用户需求: ${userInput}
    
    请只返回有效的 SQL 语句，不需要解释。SQL语句必须是PostgreSQL兼容的。
    重要：不要包含任何代码块标记（如\`\`\`或\`\`\`sql），不要包含任何注释或解释，只返回SQL语句本身。

    数据库表结构如下:
    ${dbSchema}
  `;
}
