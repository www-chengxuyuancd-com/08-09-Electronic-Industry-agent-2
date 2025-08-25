"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TablePreview } from "@/components/charts/TablePreview";
import { ChartVisualization } from "@/components/charts/ChartVisualization";
import { TableData } from "@/components/charts/types";
import { BarChart3, Table } from "lucide-react";

interface ResultDisplayProps {
  data: TableData[];
  error?: string | null;
  userInput?: string;
}

export function ResultDisplay({ data, error, userInput }: ResultDisplayProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const entityInfo = useMemo(() => {
    const input = userInput || "";
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
  }, [userInput]);

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">查询错误</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/15 border border-destructive text-destructive p-4 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">查询结果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/40 border border-dashed rounded-md p-4 text-sm text-muted-foreground">
            {entityInfo.entityType && entityInfo.entityName
              ? `您输入的${entityInfo.entityType}名称: '${entityInfo.entityName}' 找不到对应的数据`
              : "查询成功，但没有返回数据。请调整查询条件或检查数据源。"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">查询结果</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "chart" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("chart")}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              图表
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="gap-2"
            >
              <Table className="h-4 w-4" />
              表格
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "chart" ? (
          <ChartVisualization data={data} />
        ) : (
          <TablePreview data={data} />
        )}
      </CardContent>
    </Card>
  );
}
