"use client";

import React, { useState } from "react";
import { TablePreview } from "@/components/charts/TablePreview";
import { sqlClient } from "@/api-clients/sql-client";
import { TableData } from "@/components/charts/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ChartVisualization } from "@/components/charts/ChartVisualization";
import { LLMQueryInput } from "@/components/demo/llm-query-input";
import { Label } from "@/components/ui/label";

export default function SqlQueryDemo() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<TableData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecuteQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await sqlClient.executeQuery(query);

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        const errorMessage =
          response.error?.message || "查询失败，请检查SQL语句";
        const errorStatus = response.error?.status
          ? `(状态码: ${response.error.status})`
          : "";
        setError(`${errorMessage} ${errorStatus}`.trim());
        setResults([]);
      }
    } catch (err) {
      console.error("查询执行错误:", err);
      setError("执行查询时发生错误");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSqlGenerated = (sql: string) => {
    setQuery(sql);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">SQL查询演示</h1>

      {/* 自然语言生成SQL (顶部) */}
      <LLMQueryInput onSqlGenerated={handleSqlGenerated} />

      {/* SQL编辑器 (中间) */}
      <Card className="p-6 mb-6">
        <div className="mb-4">
          <Label htmlFor="sql-query" className="block text-sm font-medium mb-2">
            SQL查询语句
          </Label>
          <Textarea
            id="sql-query"
            placeholder="输入您的SQL查询语句，例如: SELECT * FROM users LIMIT 5"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-24"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleExecuteQuery}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                执行中...
              </>
            ) : (
              "执行查询"
            )}
          </Button>
        </div>
      </Card>

      {/* 错误显示 */}
      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive p-4 rounded-md mb-6">
          <p className="font-medium">查询错误</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 查询结果 (底部) */}
      {results.length > 0 && (
        <>
          <TablePreview data={results} />
          <ChartVisualization data={results} />
        </>
      )}
    </div>
  );
}
