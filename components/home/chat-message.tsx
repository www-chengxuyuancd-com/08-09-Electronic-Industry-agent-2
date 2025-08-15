"use client";

import React, { useState } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TablePreview } from "@/components/charts/TablePreview";
import { ChartVisualization } from "@/components/charts/ChartVisualization";
import { User, Bot, Copy, Play, BarChart3, Table, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onExecuteSQL?: (sql: string) => void;
  isExecuting?: boolean;
}

export function ChatMessage({
  message,
  onExecuteSQL,
  isExecuting = false,
}: ChatMessageProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [editedSQL, setEditedSQL] = useState(message.sql || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleCopySQL = () => {
    if (message.sql) {
      navigator.clipboard.writeText(message.sql);
    }
  };

  const handleExecuteSQL = () => {
    if (onExecuteSQL && editedSQL.trim()) {
      onExecuteSQL(editedSQL);
    }
  };

  const handleSaveSQL = () => {
    setIsEditing(false);
    if (onExecuteSQL && editedSQL.trim()) {
      onExecuteSQL(editedSQL);
    }
  };

  if (message.type === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start gap-3 max-w-[80%]">
          <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2">
            <p className="text-sm">{message.content}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start gap-3 max-w-[90%] w-full">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-3">
          {/* AI回复内容 */}
          <div className="bg-muted rounded-lg px-4 py-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* 思考过程 */}
          {message.thinking && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground mb-2">
                  思考过程
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {message.thinking}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SQL代码 */}
          {message.sql && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-muted-foreground">生成的SQL</div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopySQL}
                      className="h-7 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="h-7 px-2"
                    >
                      编辑
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editedSQL}
                      onChange={(e) => setEditedSQL(e.target.value)}
                      className="font-mono text-sm min-h-20"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        取消
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveSQL}
                        disabled={isExecuting}
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            执行中
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            执行
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <pre className="bg-background border rounded p-3 text-sm font-mono overflow-x-auto">
                      {message.sql}
                    </pre>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleExecuteSQL}
                        disabled={isExecuting}
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            执行中
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            执行查询
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 查询结果 */}
          {message.queryResults && message.queryResults.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-muted-foreground">查询结果</div>
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === "chart" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("chart")}
                      className="h-7 px-2"
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="h-7 px-2"
                    >
                      <Table className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {viewMode === "chart" ? (
                  <ChartVisualization data={message.queryResults} />
                ) : (
                  <TablePreview data={message.queryResults} />
                )}
              </CardContent>
            </Card>
          )}

          {/* 错误信息 */}
          {message.error && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <div className="text-xs text-destructive mb-2">错误</div>
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {message.error}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
