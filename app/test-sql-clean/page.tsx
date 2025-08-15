"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cleanSqlQuery, validateSqlQuery } from "@/lib/sql-utils";
import { Label } from "@/components/ui/label";

export default function TestSqlCleanPage() {
  const [inputSql, setInputSql] = useState("");
  const [cleanedSql, setCleanedSql] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);

  const handleCleanSql = () => {
    const cleaned = cleanSqlQuery(inputSql);
    setCleanedSql(cleaned);

    const validation = validateSqlQuery(cleaned);
    setValidationResult(validation);
  };

  const testCases = [
    {
      name: "带有markdown代码块的SQL",
      sql: "```sql\nSELECT * FROM users WHERE id = 1;\n```",
    },
    {
      name: "不带sql标签的代码块",
      sql: "```\nSELECT name, email FROM users ORDER BY name;\n```",
    },
    {
      name: "带有多余空白的SQL",
      sql: "  \n  SELECT *\n\n\nFROM users\n\nWHERE active = true;  \n  ",
    },
    {
      name: "危险的SQL操作",
      sql: "DROP TABLE users;",
    },
    {
      name: "正常的SELECT查询",
      sql: "SELECT id, name, email FROM users WHERE created_at > '2024-01-01';",
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">SQL清理功能测试</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle>输入SQL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="input-sql">SQL查询语句</Label>
              <Textarea
                id="input-sql"
                placeholder="输入包含markdown标记或其他格式的SQL..."
                value={inputSql}
                onChange={(e) => setInputSql(e.target.value)}
                className="min-h-32 font-mono text-sm"
              />
            </div>

            <Button onClick={handleCleanSql} disabled={!inputSql.trim()}>
              清理并验证SQL
            </Button>

            <div className="space-y-2">
              <h3 className="font-medium">测试用例：</h3>
              {testCases.map((testCase, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputSql(testCase.sql)}
                  className="mr-2 mb-2"
                >
                  {testCase.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card>
          <CardHeader>
            <CardTitle>清理结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cleaned-sql">清理后的SQL</Label>
              <Textarea
                id="cleaned-sql"
                value={cleanedSql}
                readOnly
                className="min-h-32 font-mono text-sm bg-gray-50"
              />
            </div>

            {validationResult && (
              <div
                className={`p-3 rounded-md ${
                  validationResult.isValid
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <div className="font-medium">
                  {validationResult.isValid ? "✅ 验证通过" : "❌ 验证失败"}
                </div>
                {validationResult.error && (
                  <div className="text-sm mt-1">{validationResult.error}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
