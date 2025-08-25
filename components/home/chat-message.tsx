"use client";

import React, { useState } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TablePreview } from "@/components/charts/TablePreview";
import { User, Bot, Copy, Play, Download, Loader2 } from "lucide-react";
import { sqlClient } from "@/api-clients/sql-client";
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
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [editedSQL, setEditedSQL] = useState(message.sql || "");
  const [isEditing, setIsEditing] = useState(false);

  const entityInfo = React.useMemo(() => {
    const input = message.content || "";
    const normalized = input.toLowerCase();
    const isONU = normalized.includes("onu") || input.includes("光猫");
    const isSplitter = input.includes("分光器");

    const match =
      input.match(/'(.*?)'/) ||
      input.match(/“(.*?)”/) ||
      input.match(/「(.*?)」/);

    const entityName = match && match[1] ? match[1].trim() : undefined;
    const entityType = isONU ? "ONU" : isSplitter ? "分光器" : undefined;

    return { entityType, entityName } as {
      entityType?: "ONU" | "分光器";
      entityName?: string;
    };
  }, [message.content]);

  // Prefer longer name among backend-provided and parsed
  const parsedName = entityInfo.entityName || "";
  const backendName = message.entityName || "";
  const displayEntityName =
    backendName.length >= parsedName.length ? backendName : parsedName;
  const displayEntityType = message.entityType || entityInfo.entityType;

  const handleCopySQL = () => {
    if (message.sql) {
      navigator.clipboard.writeText(message.sql);
    }
  };

  const handleExecuteSQL = () => {
    if (onExecuteSQL && editedSQL.trim()) {
      setDownloadUrl(null);
      onExecuteSQL(editedSQL);
    }
  };

  const handleDownload = async () => {
    try {
      if (!editedSQL.trim()) return;
      const resp = await sqlClient.exportQuery(editedSQL);
      if (resp.success && resp.data) {
        setDownloadUrl(resp.data.downloadUrl);
        // trigger browser download
        if (resp.data.downloadUrl) {
          const a = document.createElement("a");
          a.href = `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
          }${resp.data.downloadUrl}`;
          a.download = resp.data.filename || "result.xlsx";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      }
    } catch (e) {
      console.error("导出失败", e);
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

          {/* 查询结果：仅表格 + 下载按钮 */}
          {message.queryResults && message.queryResults.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-muted-foreground">查询结果</div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="h-7 px-2 gap-1"
                    >
                      <Download className="h-3 w-3" /> 下载Excel
                    </Button>
                  </div>
                </div>
                <TablePreview data={message.queryResults} />
              </CardContent>
            </Card>
          )}

          {/* 同机房推荐（当主结果不支持时显示） */}
          {Array.isArray(message.queryResults) &&
            message.queryResults.length > 0 &&
            !(message.queryResults as any[]).some(
              (r: any) =>
                r?.fenguangqi_support_open_FTTR ||
                r?.fenguangqi_support_open_fttr ||
                r?.support_open_FTTR ||
                r?.support_open_fttr
            ) &&
            Array.isArray((message as any).recommendations) &&
            ((message as any).recommendations as any[]).length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-muted-foreground">
                      同机房推荐（满足CG口且更适合开通FTTR）
                    </div>
                  </div>
                  <TablePreview
                    data={(message as any).recommendations as any}
                  />
                </CardContent>
              </Card>
            )}

          {/* 查询结果为空时的提示 */}
          {message.queryResults && message.queryResults.length === 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-muted-foreground">查询结果</div>
                  {message.sql && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="h-7 px-2 gap-1"
                    >
                      <Download className="h-3 w-3" /> 下载Excel
                    </Button>
                  )}
                </div>
                <div className="bg-muted/40 border border-dashed rounded-md p-3 text-sm text-muted-foreground">
                  {displayEntityType && displayEntityName
                    ? `您输入的${displayEntityType}名称: '${displayEntityName}' 找不到对应的数据`
                    : "查询成功，但没有返回数据。请调整查询条件或检查数据源。"}
                </div>
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
