"use client";

import { ChartConfig, ChartRenderer } from "@/components/charts";

// 示例数据 - 销售数据
const salesData = [
  { date: "2024-01", value: 100, profit: 20 },
  { date: "2024-02", value: 200, profit: 40 },
  { date: "2024-03", value: 150, profit: 30 },
  { date: "2024-04", value: 300, profit: 60 },
  { date: "2024-05", value: 280, profit: 55 },
  { date: "2024-06", value: 250, profit: 50 },
];

// 示例数据 - 浏览器使用情况
const browserData = [
  { browser: "Chrome", users: 63.5 },
  { browser: "Safari", users: 19.8 },
  { browser: "Firefox", users: 3.5 },
  { browser: "Edge", users: 3.2 },
  { browser: "Opera", users: 1.8 },
  { browser: "Other", users: 8.2 },
];

// 线图配置
const lineConfig: ChartConfig = {
  type: "line",
  title: "月度销售额和利润",
  xAxis: {
    field: "date",
    label: "日期",
  },
  series: [
    {
      field: "value",
      label: "销售额",
      color: "var(--color-blue-500)",
    },
    {
      field: "profit",
      label: "利润",
      color: "var(--color-emerald-500)",
    },
  ],
};

// 面积图配置
const areaConfig: ChartConfig = {
  type: "area",
  title: "月度销售趋势",
  xAxis: {
    field: "date",
    label: "日期",
  },
  series: [
    {
      field: "value",
      label: "销售额",
      color: "var(--color-indigo-500)",
    },
    {
      field: "profit",
      label: "利润",
      color: "var(--color-purple-500)",
    },
  ],
};

// 柱状图配置
const barConfig: ChartConfig = {
  type: "bar",
  title: "月度销售统计",
  xAxis: {
    field: "date",
    label: "日期",
  },
  series: [
    {
      field: "value",
      label: "销售额",
      color: "var(--color-orange-500)",
    },
    {
      field: "profit",
      label: "利润",
      color: "var(--color-amber-500)",
    },
  ],
};

// 饼图配置
const pieConfig: ChartConfig = {
  type: "pie",
  title: "浏览器市场份额",
  label: {
    field: "browser",
  },
  value: {
    field: "users",
  },
  colors: [
    { name: "Chrome", color: "var(--color-blue-500)" },
    { name: "Safari", color: "var(--color-green-500)" },
    { name: "Firefox", color: "var(--color-orange-500)" },
    { name: "Edge", color: "var(--color-violet-500)" },
    { name: "Opera", color: "var(--color-rose-500)" },
    { name: "Other", color: "var(--color-slate-500)" },
  ],
};

export default function ChartExamplePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">图表渲染器示例</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">线图</h2>
          <ChartRenderer data={salesData} config={lineConfig} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">面积图</h2>
          <ChartRenderer data={salesData} config={areaConfig} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">柱状图</h2>
          <ChartRenderer data={salesData} config={barConfig} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">饼图</h2>
          <ChartRenderer data={browserData} config={pieConfig} />
        </div>
      </div>
    </div>
  );
}
