import { TableData } from "./types";
import { tailwindColors, formatLabel, getColors } from "./chart-utils";

// 销售数据示例
const salesData: TableData[] = [
  { date: "2024-01", value: 100, profit: 20 },
  { date: "2024-02", value: 200, profit: 40 },
  { date: "2024-03", value: 150, profit: 30 },
  { date: "2024-04", value: 300, profit: 60 },
  { date: "2024-05", value: 280, profit: 55 },
  { date: "2024-06", value: 250, profit: 50 },
];

// 浏览器使用份额数据示例
const browserData: TableData[] = [
  { browser: "Chrome", users: 63.5 },
  { browser: "Safari", users: 19.8 },
  { browser: "Firefox", users: 3.5 },
  { browser: "Edge", users: 3.2 },
  { browser: "Opera", users: 1.8 },
  { browser: "Other", users: 8.2 },
];

// 产品数据示例
const productData: TableData[] = [
  { product: "产品A", revenue: 3200, cost: 1800, profit: 1400 },
  { product: "产品B", revenue: 4100, cost: 2200, profit: 1900 },
  { product: "产品C", revenue: 2800, cost: 1500, profit: 1300 },
  { product: "产品D", revenue: 5200, cost: 3100, profit: 2100 },
];

// 导出测试数据集
export const testDataList: Record<string, TableData[]> = {
  sales: salesData,
  browser: browserData,
  product: productData,
};

// 获取浏览器数据的唯一标签
const browserLabels = Array.from(
  new Set(browserData.map((item) => item.browser))
);

// 默认配置示例
export const defaultChartConfigs = {
  line: {
    type: "line" as const,
    title: "线图示例",
    xAxis: {
      field: "date",
      label: formatLabel("date"),
    },
    series: [
      {
        field: "value",
        label: formatLabel("value"),
        color: tailwindColors[0].value,
      },
    ],
  },
  area: {
    type: "area" as const,
    title: "面积图示例",
    xAxis: {
      field: "date",
      label: formatLabel("date"),
    },
    series: [
      {
        field: "value",
        label: formatLabel("value"),
        color: tailwindColors[5].value,
      },
    ],
  },
  bar: {
    type: "bar" as const,
    title: "柱状图示例",
    xAxis: {
      field: "product",
      label: formatLabel("product"),
    },
    series: [
      {
        field: "revenue",
        label: formatLabel("revenue"),
        color: tailwindColors[11].value,
      },
    ],
  },
  pie: {
    type: "pie" as const,
    title: "饼图示例",
    label: {
      field: "browser",
    },
    value: {
      field: "users",
    },
    colors: browserLabels.map((label, index) => ({
      name: String(label),
      color: tailwindColors[index % tailwindColors.length].value,
    })),
  },
};
