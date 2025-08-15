"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Play } from "lucide-react";

interface SqlEditorProps {
  sql: string;
  onSqlChange: (sql: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  disabled?: boolean;
}

export function SqlEditor({
  sql,
  onSqlChange,
  onExecute,
  isExecuting,
  disabled = false,
}: SqlEditorProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          SQL 查询编辑器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="sql-query" className="block text-sm font-medium mb-2">
            SQL 查询语句
          </Label>
          <Textarea
            id="sql-query"
            placeholder="SQL 查询将在这里自动生成..."
            value={sql}
            onChange={(e) => onSqlChange(e.target.value)}
            className="min-h-24 font-mono text-sm"
            disabled={disabled}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onExecute}
            disabled={isExecuting || !sql.trim() || disabled}
            className="gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                执行中...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                执行查询
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
