"use client";

import { useState } from "react";
import { ChartConfig, ChartRenderer } from "@/components/charts";
import { ChartConfigEditor } from "@/components/charts/ChartConfigEditor";
import { TablePreview } from "@/components/charts/TablePreview";
import { DataSwitcher } from "@/components/charts/DataSwitcher";
import {
  testDataList,
  defaultChartConfigs,
} from "@/components/charts/test-data";

export default function ChartConfigDemoPage() {
  const [dataKey, setDataKey] = useState("sales");
  const [config, setConfig] = useState<ChartConfig>(defaultChartConfigs.line);
  const data = testDataList[dataKey];

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">图表配置编辑器演示</h1>
        <p className="text-muted-foreground">
          这个页面演示了图表配置编辑器的功能，你可以选择数据集，编辑图表配置，并实时预览效果。
        </p>
      </div>

      <DataSwitcher value={dataKey} onChange={setDataKey} />

      <TablePreview data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartConfigEditor data={data} value={config} onChange={setConfig} />

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">图表预览</h2>
          <div className="border rounded-md p-4 bg-white">
            <ChartRenderer data={data} config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
