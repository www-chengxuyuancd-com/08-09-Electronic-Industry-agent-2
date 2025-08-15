/**
 * 表格数据类型
 */
export interface TableData {
  [key: string]: string | number | boolean | null;
}

// 基础图表配置
export interface BaseChartConfig {
  type: "line" | "area" | "bar" | "pie";
  title?: string;
}

// 笛卡尔坐标系图表配置（线图、面积图、柱状图）
export interface CartesianChartConfig extends BaseChartConfig {
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
export interface PieChartConfig extends BaseChartConfig {
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

export type ChartConfig = CartesianChartConfig | PieChartConfig;

// 图表渲染器属性
export interface ChartRendererProps {
  data: TableData[];
  config: ChartConfig;
  width?: number;
  height?: number;
  className?: string;
}
