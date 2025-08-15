"use client";

import { useEffect, useState } from "react";
import { ChartConfig, ChartRenderer, TableData } from "@/components/charts";
import { ChartConfigEditor } from "@/components/charts/ChartConfigEditor";
import { getDefaultConfigFromData } from "@/components/charts/chart-utils";

interface ChartVisualizationProps {
  data: TableData[];
}

export function ChartVisualization({ data }: ChartVisualizationProps) {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: "line",
    title: "查询结果图表",
    xAxis: {
      field: "",
      label: "X轴",
    },
    series: [
      {
        field: "",
        label: "数据系列",
      },
    ],
  });

  // Initialize chart config based on data
  useEffect(() => {
    if (data.length > 0) {
      const defaultConfig = getDefaultConfigFromData(data, "line");
      if (defaultConfig) {
        setChartConfig(defaultConfig);
      }
    }
  }, [data]);

  const handleConfigChange = (newConfig: ChartConfig) => {
    setChartConfig(newConfig);
  };

  if (data.length === 0) return null;

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-bold">查询结果图表</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartConfigEditor
          data={data}
          value={chartConfig}
          onChange={handleConfigChange}
        />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">图表预览</h3>
          <div className="border rounded-md p-4 bg-white">
            <ChartRenderer data={data} config={chartConfig} />
          </div>
        </div>
      </div>
    </div>
  );
}
