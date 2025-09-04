"use client";

import React, { useRef, useEffect, useState } from "react";
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

  const [draft, setDraft] = useState<string>("");

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
                使用自然语言描述您的查询需求，AI 将为您生成并执行 SQL
                语句，最终返回CSV内容
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl w-full">
              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 text-left whitespace-normal leading-relaxed"
                onClick={() => setDraft("帮我分析OLT低效问题")}
              >
                <span className="block">
                  <span className="font-medium text-primary">1.</span>{" "}
                  "帮我分析OLT低效问题"
                </span>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 text-left whitespace-normal leading-relaxed"
                onClick={() =>
                  setDraft(
                    "帮我检查二级分光器 '四川内江资中县龙结镇方家坝村小区龙结镇方家坝村3组叶阳福家旁/GF018-POS001' 能否开通FTTR"
                  )
                }
              >
                <span className="block">
                  <span className="font-medium text-primary">2.</span>{" "}
                  帮我检查二级分光器
                  <br />
                  <span className="text-muted-foreground">
                    '四川内江资中县龙结镇方家坝村小区龙结镇方家坝村3组叶阳福家旁/GF018-POS001'
                  </span>
                  <br />
                  能否开通FTTR
                </span>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 text-left whitespace-normal leading-relaxed"
                onClick={() =>
                  setDraft(
                    "帮我查看ONU用户 '四川内江隆昌市西城郡七期西城学府小区古湖街道人民中路辅路3号楼5楼/GF008-JK-ONU04-HW-20955679544' 能否开通FTTR"
                  )
                }
              >
                <span className="block">
                  <span className="font-medium text-primary">3.</span>{" "}
                  帮我查看ONU用户
                  <br />
                  <span className="text-muted-foreground">
                    '四川内江隆昌市西城郡七期西城学府小区古湖街道人民中路辅路3号楼5楼/GF008-JK-ONU04-HW-20955679544'
                  </span>
                  <br />
                  能否开通FTTR
                </span>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 text-left whitespace-normal leading-relaxed"
                onClick={() =>
                  setDraft(
                    "帮我查看ONU用户 '四川内江隆昌县古湖街道卫星安置房二期小区人民中路二段卫星安置房二期2栋1单元7楼/GF008-JK-ONU07-HW-20985923232' 能否开通FTTR"
                  )
                }
              >
                <span className="block">
                  <span className="font-medium text-primary">4.</span>{" "}
                  帮我查看ONU用户
                  <br />
                  <span className="text-muted-foreground">
                    '四川内江隆昌县古湖街道卫星安置房二期小区人民中路二段卫星安置房二期2栋1单元7楼/GF008-JK-ONU07-HW-20985923232'
                  </span>
                  <br />
                  能否开通FTTR
                </span>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 text-left whitespace-normal leading-relaxed md:col-span-2"
                onClick={() =>
                  setDraft(
                    "帮我查看ONU用户 '内江隆昌县迎祥镇杨家山小区杨家山11号/GF011-JK-ONU04-HW-20985863208' 能否开通FTTR"
                  )
                }
              >
                <span className="block">
                  <span className="font-medium text-primary">5.</span>{" "}
                  帮我查看ONU用户
                  <br />
                  <span className="text-muted-foreground">
                    '内江隆昌县迎祥镇杨家山小区杨家山11号/GF011-JK-ONU04-HW-20985863208'
                  </span>
                  <br />
                  能否开通FTTR
                </span>
              </Button>
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
            onSubmit={(val) => {
              setDraft("");
              sendMessage(val);
            }}
            value={draft}
            onChange={setDraft}
            disabled={isThinking}
            placeholder="请输入您的查询需求，例如：查询所有用户的信息"
          />
        </div>
      </div>
    </div>
  );
}
