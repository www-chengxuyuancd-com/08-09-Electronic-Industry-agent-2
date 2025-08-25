import React, { useState, useCallback } from "react";
import { ChatMessage, ChatState } from "@/types/chat";
import { useLLMStream } from "./use-llm-stream";
import { useSqlQuery } from "./use-sql-query";

interface UseChatReturn extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  executeSQL: (sql: string) => Promise<void>;
  clearChat: () => void;
  isExecuting: boolean;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentThinking, setCurrentThinking] = useState<string>("");

  const {
    thinking,
    isThinking,
    isComplete,
    generatedSql,
    error: llmError,
    generateSQL,
    reset: resetLLM,
  } = useLLMStream();

  const {
    queryResults,
    recommendations,
    queryError,
    isExecuting,
    executeQuery,
    clearResults,
    entityType,
    entityName,
  } = useSqlQuery();

  const sendMessage = useCallback(
    async (content: string) => {
      // 添加用户消息
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setCurrentThinking("");

      // 开始生成AI回复
      try {
        await generateSQL(content);
      } catch (error) {
        // 添加错误消息
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: "抱歉，处理您的请求时出现了错误。",
          timestamp: new Date(),
          error: error instanceof Error ? error.message : "未知错误",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [generateSQL]
  );

  const executeSQL = useCallback(
    async (sql: string) => {
      try {
        // Try to extract entity info from the last user message content
        let inferredType: string | undefined = entityType;
        let inferredName: string | undefined = entityName;
        const lastUser = messages
          .slice()
          .reverse()
          .find((m) => m.type === "user");
        if (lastUser) {
          const text = lastUser.content || "";
          const isONU =
            text.toLowerCase().includes("onu") || text.includes("光猫");
          const isSplitter = text.includes("分光器");
          const match =
            text.match(/'(.*?)'/) ||
            text.match(/“(.*?)”/) ||
            text.match(/「(.*?)」/);
          const name = match && match[1] ? match[1].trim() : undefined;
          if (!inferredType)
            inferredType = isONU ? "ONU" : isSplitter ? "分光器" : undefined;
          if (!inferredName && name) inferredName = name;
        }

        await executeQuery(sql, {
          entityType: inferredType,
          entityName: inferredName,
        });
        // executeQuery 会更新 queryResults 状态，我们在 useEffect 中监听这个变化
      } catch (error) {
        // 更新最后一条AI消息，添加错误信息
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.type === "assistant") {
            lastMessage.error =
              error instanceof Error ? error.message : "查询执行失败";
          }
          return newMessages;
        });
      }
    },
    [executeQuery]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentThinking("");
    resetLLM();
    clearResults();
  }, [resetLLM, clearResults]);

  // 监听思考过程更新
  React.useEffect(() => {
    setCurrentThinking(thinking);
  }, [thinking]);

  // 监听AI回复完成
  React.useEffect(() => {
    if (isComplete && generatedSql) {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: "我已经为您生成了SQL查询，正在执行...",
        timestamp: new Date(),
        thinking: thinking,
        sql: generatedSql,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentThinking("");

      // 自动执行SQL
      executeSQL(generatedSql);
    }
  }, [isComplete, generatedSql, thinking, executeSQL]);

  // 监听查询结果更新（包括空结果），并附带实体元数据与推荐
  React.useEffect(() => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage && lastMessage.type === "assistant") {
        lastMessage.queryResults = queryResults;
        if (recommendations && (recommendations as any).length > 0) {
          (lastMessage as any).recommendations = recommendations;
        }
        if (entityType) lastMessage.entityType = entityType;
        if (entityName) lastMessage.entityName = entityName;
      }
      return newMessages;
    });
  }, [queryResults, recommendations, entityType, entityName]);

  // 监听查询错误
  React.useEffect(() => {
    if (queryError) {
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.type === "assistant") {
          lastMessage.error = queryError;
        }
        return newMessages;
      });
    }
  }, [queryError]);

  // 监听LLM错误
  React.useEffect(() => {
    if (llmError) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: "抱歉，生成SQL时出现了错误。",
        timestamp: new Date(),
        error: llmError,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentThinking("");
    }
  }, [llmError]);

  return {
    messages,
    isThinking,
    currentThinking,
    sendMessage,
    executeSQL,
    clearChat,
    isExecuting,
  };
}
