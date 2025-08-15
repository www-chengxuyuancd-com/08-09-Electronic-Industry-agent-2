"use client";

import React, { useRef, useEffect } from "react";
import { ChatMessage } from "./chat-message";
import { ThinkingIndicator } from "./thinking-indicator";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { Trash2 } from "lucide-react";

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isThinking,
    currentThinking,
    sendMessage,
    executeSQL,
    clearChat,
    isExecuting,
  } = useChat();

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, currentThinking]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">智能 SQL 查询助手</h1>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            清空对话
          </Button>
        )}
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isThinking && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-4xl">💬</div>
            <div className="space-y-2">
              <h2 className="text-lg font-medium">开始对话</h2>
              <p className="text-muted-foreground max-w-md">
                使用自然语言描述您的查询需求，AI 将为您生成并执行 SQL 语句
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
              <div className="p-3 border rounded-lg text-sm text-muted-foreground">
                "查询所有用户的信息"
              </div>
              <div className="p-3 border rounded-lg text-sm text-muted-foreground">
                "统计每个项目的评估数量"
              </div>
              <div className="p-3 border rounded-lg text-sm text-muted-foreground">
                "显示最近一周的活跃用户"
              </div>
              <div className="p-3 border rounded-lg text-sm text-muted-foreground">
                "按部门分组统计员工数量"
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onExecuteSQL={executeSQL}
            isExecuting={isExecuting}
          />
        ))}

        {/* 思考指示器 */}
        <ThinkingIndicator thinking={currentThinking} isThinking={isThinking} />

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSubmit={sendMessage}
            disabled={isThinking}
            placeholder="请输入您的查询需求，例如：查询所有用户的信息"
          />
        </div>
      </div>
    </div>
  );
}
