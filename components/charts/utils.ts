import { ChartConfig as UIChartConfig } from "@/components/ui/chart";
import { CartesianChartConfig, PieChartConfig, TableData } from "./types";

/**
 * 将用户图表配置转换为UI库需要的图表配置
 */
export function convertToUIChartConfig(
  config: CartesianChartConfig | PieChartConfig
): UIChartConfig {
  const uiConfig: UIChartConfig = {};

  if (config.type === "pie") {
    // 处理饼图配置
    uiConfig[config.value.field] = {
      label: config.value.field,
    };

    // 添加颜色配置
    if (config.colors && config.colors.length > 0) {
      config.colors.forEach((colorItem) => {
        if (colorItem.name) {
          uiConfig[colorItem.name] = {
            label: colorItem.name,
            color: colorItem.color,
          };
        }
      });
    }
  } else {
    // 处理笛卡尔坐标系图表配置
    config.series.forEach((item) => {
      uiConfig[item.field] = {
        label: item.label || item.field,
        color: item.color,
      };
    });
  }

  return uiConfig;
}

/**
 * 转换数据格式以适配图表渲染
 */
export function transformData(
  data: TableData[],
  config: CartesianChartConfig | PieChartConfig
): any[] {
  if (config.type === "pie") {
    // 转换饼图数据
    return data.map((item) => {
      const labelValue = String(item[config.label.field]);
      const colorConfig = config.colors?.find((c) => c.name === labelValue);

      return {
        [config.label.field]: labelValue,
        [config.value.field]: Number(item[config.value.field]),
        // 明确设置每个分段的填充颜色
        fill: colorConfig?.color || "#999",
        // 确保移除var(--color-...)格式
        name: labelValue,
      };
    });
  } else {
    // 转换笛卡尔坐标系图表数据
    return data.map((item) => {
      const result: any = {
        [config.xAxis.field]: item[config.xAxis.field],
      };

      config.series.forEach((series) => {
        result[series.field] = Number(item[series.field]);
      });

      return result;
    });
  }
}

/**
 * 检测并修复非法的图表配置
 */
export function validateAndFixConfig(
  config: CartesianChartConfig | PieChartConfig,
  data: TableData[]
): CartesianChartConfig | PieChartConfig {
  const clone = { ...config };

  // 验证字段是否存在于数据中
  if (config.type === "pie") {
    const pieConfig = clone as PieChartConfig;
    if (!data.length || !(pieConfig.label.field in data[0])) {
      pieConfig.label.field = Object.keys(data[0] || {})[0] || "label";
    }
    if (!data.length || !(pieConfig.value.field in data[0])) {
      pieConfig.value.field = Object.keys(data[0] || {})[1] || "value";
    }
    return pieConfig;
  } else {
    const cartesianConfig = clone as CartesianChartConfig;
    if (!data.length || !(cartesianConfig.xAxis.field in data[0])) {
      cartesianConfig.xAxis.field = Object.keys(data[0] || {})[0] || "x";
    }
    cartesianConfig.series = cartesianConfig.series.filter((series) => {
      return data.length ? series.field in data[0] : true;
    });
    if (cartesianConfig.series.length === 0 && data.length > 0) {
      const fields = Object.keys(data[0]).filter(
        (field) => field !== cartesianConfig.xAxis.field
      );
      if (fields.length > 0) {
        cartesianConfig.series = [
          {
            field: fields[0],
            label: fields[0],
          },
        ];
      }
    }
    return cartesianConfig;
  }
}
