"use client";

import { CartesianChart } from "./cartesian-chart";
import { PieChart } from "./pie-chart";
import { ChartConfig, ChartRendererProps } from "./types";

export function ChartRenderer({
  data,
  config,
  width,
  height,
  className,
}: ChartRendererProps) {
  // 根据图表类型选择对应的图表组件
  if (config.type === "pie") {
    return (
      <PieChart
        data={data}
        config={config}
        width={width}
        height={height}
        className={className}
      />
    );
  } else {
    return (
      <CartesianChart
        data={data}
        config={config}
        width={width}
        height={height}
        className={className}
      />
    );
  }
}

// 导出所有类型和组件
export * from "./types";
export * from "./utils";
export { CartesianChart } from "./cartesian-chart";
export { PieChart } from "./pie-chart";
