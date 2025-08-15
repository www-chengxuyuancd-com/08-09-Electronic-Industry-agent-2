"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

import { CartesianChartConfig, TableData } from "./types";
import {
  convertToUIChartConfig,
  transformData,
  validateAndFixConfig,
} from "./utils";

interface CartesianChartProps {
  data: TableData[];
  config: CartesianChartConfig;
  width?: number;
  height?: number;
  className?: string;
}

export function CartesianChart({
  data,
  config,
  width,
  height,
  className,
}: CartesianChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{config.title || "图表"}</CardTitle>
          <CardDescription>暂无数据</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <p className="text-muted-foreground">没有可显示的数据</p>
        </CardContent>
      </Card>
    );
  }

  // 验证并修复配置
  const validatedConfig = validateAndFixConfig(
    config,
    data
  ) as CartesianChartConfig;

  // 转换数据
  const chartData = transformData(data, validatedConfig);

  // 转换为UI需要的图表配置
  const uiChartConfig = convertToUIChartConfig(validatedConfig);

  // 共通的图表属性
  const chartProps = {
    accessibilityLayer: true,
    data: chartData,
    margin: { left: 12, right: 12 },
    width,
    height,
  };

  // 渲染图表内容
  const renderChart = () => {
    switch (validatedConfig.type) {
      case "line":
        return (
          <LineChart {...chartProps}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={validatedConfig.xAxis.field}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              padding={{ left: 15, right: 15 }}
              interval="preserveStart"
              minTickGap={5}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {validatedConfig.series.map((series) => (
              <Line
                key={series.field}
                dataKey={series.field}
                type="monotone"
                stroke={`var(--color-${series.field})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={validatedConfig.xAxis.field}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              padding={{ left: 15, right: 15 }}
              interval="preserveStart"
              minTickGap={5}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            {validatedConfig.series.map((series) => (
              <Area
                key={series.field}
                dataKey={series.field}
                type="natural"
                fill={`var(--color-${series.field})`}
                fillOpacity={0.4}
                stroke={`var(--color-${series.field})`}
                stackId="a"
              />
            ))}
          </AreaChart>
        );
      case "bar":
      default:
        return (
          <BarChart {...chartProps}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={validatedConfig.xAxis.field}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            {validatedConfig.series.map((series, index) => (
              <Bar
                key={series.field}
                dataKey={series.field}
                stackId="a"
                fill={`var(--color-${series.field})`}
                radius={
                  index === 0
                    ? [0, 0, 4, 4]
                    : index === validatedConfig.series.length - 1
                    ? [4, 4, 0, 0]
                    : [0, 0, 0, 0]
                }
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>
          {validatedConfig.title ||
            `${
              validatedConfig.type.charAt(0).toUpperCase() +
              validatedConfig.type.slice(1)
            } 图表`}
        </CardTitle>
        <CardDescription>
          {validatedConfig.xAxis.label || validatedConfig.xAxis.field}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={uiChartConfig}>{renderChart()}</ChartContainer>
      </CardContent>
    </Card>
  );
}
