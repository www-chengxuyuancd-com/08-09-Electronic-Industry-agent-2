# LLM 集成技术方案

## 系统架构

基于需求，我们将实现一个连接用户输入、LLM 服务和 SQL 查询的系统：

```
用户输入 -> 后端 API -> LLM 服务 -> 生成 SQL -> 填充到查询中 -> 返回结果
```

## 后端 API 实现

### 1. 创建 LLM 调用 API

创建新的 API 路由：`app/api/call-llm/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createOpenAIClient, createGeminiClient } from "@/lib/llm-clients";

// 错误处理和响应格式与现有 SQL 查询 API 保持一致

export async function POST(req: NextRequest) {
  try {
    const { userInput, modelConfig } = await req.json();

    if (!userInput) {
      return NextResponse.json(
        { error: "Missing user input" },
        { status: 400 }
      );
    }

    // 根据配置选择不同的 LLM 客户端
    const llmClient =
      modelConfig.type === "gemini"
        ? createGeminiClient(modelConfig)
        : createOpenAIClient(modelConfig);

    // 构建 prompt（包含 SQL 转换指令）
    const prompt = buildSqlPrompt(userInput);

    // 调用 LLM
    const sqlResult = await llmClient.generate(prompt);

    return NextResponse.json({ sql: sqlResult });
  } catch (error: any) {
    console.error("LLM API Error:", error);
    return NextResponse.json(
      { error: error.message || "处理请求时发生错误" },
      { status: 500 }
    );
  }
}
```

### 2. LLM 客户端实现

创建 `lib/llm-clients.ts`，支持不同 LLM 提供商：

```typescript
// OpenAI 风格 API 客户端
export function createOpenAIClient(config: OpenAIConfig) {
  // 实现 OpenAI API 调用
  // 支持自定义 endpoint、model 和 apiKey
}

// Gemini 客户端
export function createGeminiClient(config: GeminiConfig) {
  // 实现 Google Gemini API 调用
}

// 构建 SQL 转换 prompt
export function buildSqlPrompt(userInput: string) {
  return `
    你是一个 SQL 专家，请将以下自然语言查询转换为 SQL 语句：
    
    用户查询: ${userInput}
    
    请只返回有效的 SQL 语句，不需要解释。
  `;
}
```

### 3. 配置类型定义

创建 `types/llm.ts`：

```typescript
export interface OpenAIConfig {
  endpoint: string;
  model: string;
  apiKey: string;
}

export interface GeminiConfig {
  apiKey: string;
  model?: string;
}

export interface LLMRequest {
  userInput: string;
  modelConfig: OpenAIConfig | GeminiConfig;
}
```

## 前端实现

### 1. 前端客户端

创建 `api-clients/llm-api.ts`：

```typescript
import { LLMRequest } from "@/types/llm";

export async function callLLM(request: LLMRequest): Promise<{ sql: string }> {
  const response = await fetch("/api/call-llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "调用 LLM 服务失败");
  }

  return response.json();
}
```

### 2. 查询页面集成

在 `/demo/query` 页面添加 LLM 输入组件：

```tsx
// 添加 LLM 查询输入组件
function LLMQueryInput({
  onSqlGenerated,
}: {
  onSqlGenerated: (sql: string) => void;
}) {
  const [input, setInput] = useState("");
  const [modelConfig, setModelConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await callLLM({
        userInput: input,
        modelConfig: modelConfig,
      });
      onSqlGenerated(result.sql);
    } catch (error) {
      console.error("LLM query failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 模型配置选择 UI */}
      {/* 用户输入框 */}
      {/* 提交按钮 */}
    </div>
  );
}
```

## 集成到现有系统

1. LLM 生成的 SQL 将填充到现有的 SQL 编辑器中
2. 用户可以检查和编辑生成的 SQL
3. 使用现有的 `/api/sql-query` 执行 SQL

## 部署和配置

1. 环境变量配置：

   - `LLM_DEFAULT_PROVIDER`：默认 LLM 提供商
   - `OPENAI_API_KEY`：OpenAI API 密钥（可选）
   - `GEMINI_API_KEY`：Gemini API 密钥（可选）

2. 安全性考虑：
   - 客户端不存储 API 密钥
   - 服务端验证和清理 LLM 生成的 SQL

## 后续优化

1. 缓存常见查询结果
2. 添加 SQL 解释功能
3. 支持更多 LLM 提供商
4. 增强 prompt 工程以提高 SQL 生成质量
