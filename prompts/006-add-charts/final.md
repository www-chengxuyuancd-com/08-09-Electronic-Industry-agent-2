# 低代码图表渲染组件技术方案

封装一个 ChartRenderer 组件，用于将任何 table data 渲染为不同的 charts

## 支持的图表

- components/demo/area-chart.tsx
- components/demo/bar-chart.tsx
- components/demo/line-chart.tsx
- components/demo/pie-chart.tsx

## 技术选型

- 图表库：Recharts（基于 React 的声明式图表库）
- 类型系统：TypeScript
- UI 框架：shadcn/ui

## 核心类型定义

### 基础数据类型

```typescript
// 表格数据类型
interface TableData {
  [key: string]: string | number | boolean | null;
}
```

### 图表配置类型

```typescript
// 基础图表配置
interface BaseChartConfig {
  type: "line" | "area" | "bar" | "pie";
  title?: string;
}

// 笛卡尔坐标系图表配置（线图、面积图、柱状图）
interface CartesianChartConfig extends BaseChartConfig {
  type: "line" | "area" | "bar";
  xAxis: {
    field: string;
    label?: string;
  };
  series: {
    field: string;
    label?: string;
    color?: string;
  }[];
}

// 饼图配置
interface PieChartConfig extends BaseChartConfig {
  type: "pie";
  label: {
    field: string;
  };
  value: {
    field: string;
  };
  colors?: {
    color: string;
    name?: string;
  }[];
}

type ChartConfig = CartesianChartConfig | PieChartConfig;
```

### 组件接口

```typescript
interface ChartRendererProps {
  data: TableData[];
  config: ChartConfig;
  width?: number;
  height?: number;
  className?: string;
}
```

## 组件结构

```
components/
  charts/
    index.tsx                # 主组件入口
    types.ts                 # 类型定义
    cartesian-chart.tsx      # 笛卡尔坐标系图表（线图、面积图、柱状图）
    pie-chart.tsx           # 饼图
    utils.ts                # 工具函数
```

## 使用示例

```typescript
const config: ChartConfig = {
  type: "line",
  xAxis: {
    field: "date",
    label: "日期",
  },
  series: [
    {
      field: "value",
      label: "销售额",
      color: "#8884d8",
    },
    {
      field: "profit",
      label: "利润",
      color: "#82ca9d",
    },
  ],
};

const data = [
  { date: "2024-01", value: 100, profit: 20 },
  { date: "2024-02", value: 200, profit: 40 },
  // ...
];

<ChartRenderer data={data} config={config} />;
```
