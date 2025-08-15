# 智能 SQL 查询聊天界面

## 功能概述

这是一个类似 ChatGPT 的智能 SQL 查询界面，允许用户通过自然语言与 AI 对话来生成和执行 SQL 查询。

## 主要特性

### 🤖 智能对话

- 支持多轮对话历史
- 自然语言转 SQL
- 实时思考过程展示
- 打字机效果的流式响应

### 💬 聊天界面

- 用户消息和 AI 回复的气泡样式
- 自动滚动到最新消息
- 清空对话功能
- 响应式设计

### 🔧 SQL 功能

- 自动生成 SQL 查询
- 可编辑和重新执行 SQL
- 查询结果的表格和图表展示
- 错误信息显示

### 📊 数据可视化

- 表格视图
- 图表视图（柱状图、折线图等）
- 视图切换功能

## 使用方法

### 1. 启动应用

```bash
pnpm run dev
```

### 2. 配置环境变量

确保 `.env` 文件中配置了正确的 API 密钥：

```env
# LLM 提供商选择
LLM_PROVIDER=gemini

# Gemini 配置
GEMINI_API_KEY=your_gemini_api_key
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# 或者使用 OpenAI
# LLM_PROVIDER=openai
# OPENAI_API_KEY=your_openai_api_key

# 数据库配置
DATABASE_URL=your_database_url
```

### 3. 开始对话

在输入框中输入自然语言查询，例如：

- "查询所有用户的信息"
- "统计每个项目的评估数量"
- "显示最近一周的活跃用户"
- "按部门分组统计员工数量"

### 4. 查看结果

- AI 会显示思考过程
- 生成对应的 SQL 查询
- 自动执行并显示结果
- 可以在表格和图表视图之间切换

### 5. 编辑和重新执行

- 点击 SQL 代码块的"编辑"按钮
- 修改 SQL 语句
- 点击"执行"重新运行查询

## 组件架构

### 核心组件

- `ChatInterface`: 主聊天界面
- `ChatMessage`: 消息组件（用户/AI）
- `ThinkingIndicator`: 思考过程指示器
- `ChatInput`: 聊天输入框

### 自定义 Hooks

- `useChat`: 聊天状态管理
- `useLLMStream`: LLM 流式响应
- `useSqlQuery`: SQL 查询执行

### API 路由

- `/api/call-llm-stream`: 流式 LLM 调用
- `/api/sql-query`: SQL 查询执行

## 技术特性

### 流式响应

- 支持 OpenAI 和 Gemini 的流式 API
- 实时显示 AI 思考过程
- 打字机效果的文本展示

### 状态管理

- React hooks 管理聊天状态
- 消息历史持久化
- 错误处理和重试机制

### 用户体验

- 自动滚动到最新消息
- 响应式设计适配移动端
- 加载状态和错误提示
- 键盘快捷键支持（Enter 发送，Shift+Enter 换行）

## 自定义配置

### 修改 LLM 提供商

在 `.env` 文件中设置 `LLM_PROVIDER`：

- `gemini`: 使用 Google Gemini
- `openai`: 使用 OpenAI GPT

### 自定义样式

所有组件都使用 Tailwind CSS 和 shadcn/ui，可以轻松自定义样式。

### 扩展功能

- 添加更多图表类型
- 支持文件上传和导出
- 添加查询历史保存
- 集成更多 LLM 提供商
