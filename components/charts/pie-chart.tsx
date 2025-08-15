"use client";

import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

import { PieChartConfig, TableData } from "./types";
import {
  convertToUIChartConfig,
  transformData,
  validateAndFixConfig,
} from "./utils";
import { getColors } from "./chart-utils";

interface PieChartProps {
  data: TableData[];
  config: PieChartConfig;
  width?: number;
  height?: number;
  className?: string;
}

export function PieChart({
  data,
  config,
  width,
  height,
  className,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{config.title || "饼图"}</CardTitle>
          <CardDescription>暂无数据</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <p className="text-muted-foreground">没有可显示的数据</p>
        </CardContent>
      </Card>
    );
  }

  // 验证并修复配置
  const validatedConfig = validateAndFixConfig(config, data) as PieChartConfig;

  // 转换数据
  const chartData = transformData(data, validatedConfig);

  // 转换为UI需要的图表配置
  const uiChartConfig = convertToUIChartConfig(validatedConfig);

  // 提取标签字段的所有唯一值
  const labelField = validatedConfig.label.field;
  const uniqueLabels = Array.from(
    new Set(data.map((item) => String(item[labelField])))
  );

  // 为每个分类准备颜色
  const colorMap = new Map();

  // 从配置中获取颜色
  if (validatedConfig.colors && validatedConfig.colors.length > 0) {
    validatedConfig.colors.forEach((colorItem) => {
      if (colorItem.name) {
        colorMap.set(colorItem.name, colorItem.color);
      }
    });
  }

  // 为没有颜色的标签分配默认颜色
  const defaultColors = getColors(uniqueLabels.length);
  uniqueLabels.forEach((label, index) => {
    if (!colorMap.has(label)) {
      colorMap.set(label, defaultColors[index]);
    }
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="items-center">
        <CardTitle>{validatedConfig.title || "饼图"}</CardTitle>
        <CardDescription>{validatedConfig.value.field}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={uiChartConfig}
          className={cn(
            "mx-auto aspect-square max-h-[250px] [&_.recharts-pie-label-text]:fill-foreground",
            className
          )}
        >
          <RechartsPieChart width={width} height={height}>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey={validatedConfig.value.field}
              nameKey={validatedConfig.label.field}
              label
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill || colorMap.get(entry[labelField]) || "#999"}
                />
              ))}
            </Pie>
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
