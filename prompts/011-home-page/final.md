# 首页智能 SQL 查询界面实现

## 目标

在应用首页实现类似 ChatGPT 的智能 SQL 查询界面，包含流式输出和自动执行功能。

## 核心功能

### 1. 聊天输入组件 (`ChatInput`)

- 使用 shadcn/ui 的 Input 组件
- 支持回车发送
- 发送后清空输入框
- 用户可以进行多轮对话，聊天框一直显示在下方

### 2. 思考过程组件 (`ThinkingProcess`)

- 流式显示 LLM 思考过程
- 使用打字机效果逐字显示
- 包含加载状态和完成状态

### 3. SQL 编辑器组件 (`SqlEditor`)

- 基于现有 Textarea 组件
- SQL 生成完成后自动填充
- 自动执行一次查询
- 支持手动编辑和重新执行

### 4. 结果展示组件 (`ResultDisplay`)

- 复用现有的 TablePreview 和 ChartVisualization
- 添加图表/表格切换按钮

## 技术实现

### API 增强

- 修改`/api/call-llm`支持流式响应
- 返回思考过程和最终 SQL
- 使用 Server-Sent Events (SSE)

### 状态管理

```typescript
const [userInput, setUserInput] = useState<string>("");
const [thinking, setThinking] = useState<string>("");
const [isThinking, setIsThinking] = useState<boolean>(false);
const [generatedSql, setGeneratedSql] = useState<string>("");
const [queryResults, setQueryResults] = useState<TableData[]>([]);
const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
```

### 流程控制

1. 用户输入 → 开始思考流式输出
2. 思考完成 → 生成 SQL 并自动执行
3. 查询完成 → 展示结果（默认图表模式）

## 组件结构

```
app/page.tsx (主页面)
├── components/home/chat-input.tsx
├── components/home/thinking-process.tsx
├── components/home/sql-editor.tsx
└── components/home/result-display.tsx
```

## 样式要求

- 使用现有的 shadcn/ui 组件
- 保持与 demo 页面一致的设计风格
- 响应式布局
- 流畅的动画效果
