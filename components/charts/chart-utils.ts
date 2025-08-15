// 预设的 Tailwind CSS 颜色
export const tailwindColors = [
  { name: "slate", value: "hsl(215.4 16.3% 46.9%)" },
  { name: "red", value: "hsl(0 72.2% 50.6%)" },
  { name: "orange", value: "hsl(24.6 95% 53.1%)" },
  { name: "amber", value: "hsl(37.7 92.1% 50.2%)" },
  { name: "yellow", value: "hsl(47.9 95.8% 53.1%)" },
  { name: "lime", value: "hsl(84.8 71.4% 45.3%)" },
  { name: "green", value: "hsl(142.1 70.6% 45.3%)" },
  { name: "emerald", value: "hsl(160.1 84.1% 39.4%)" },
  { name: "teal", value: "hsl(173.4 80.4% 40%)" },
  { name: "cyan", value: "hsl(188.7 94.5% 42.7%)" },
  { name: "sky", value: "hsl(198.6 88.7% 48.4%)" },
  { name: "blue", value: "hsl(217.2 91.2% 59.8%)" },
  { name: "indigo", value: "hsl(226.5 70.7% 55.3%)" },
  { name: "violet", value: "hsl(250.5 95.3% 63.7%)" },
  { name: "purple", value: "hsl(269.2 83.8% 62.2%)" },
  { name: "fuchsia", value: "hsl(289.1 100% 66.1%)" },
  { name: "pink", value: "hsl(332.7 81.1% 66.9%)" },
  { name: "rose", value: "hsl(353.9 100% 66.1%)" },
];

/**
 * 获取颜色数组
 * @param count 需要的颜色数量
 * @returns 颜色数组
 */
export function getColors(count: number): string[] {
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    colors.push(tailwindColors[i % tailwindColors.length].value);
  }

  return colors;
}

/**
 * 将驼峰命名转换为可读标签
 * @param str 驼峰命名字符串
 * @returns 格式化后的标签
 */
export function formatLabel(str: string): string {
  // 处理 camelCase 到空格分隔的格式
  const formatted = str
    // 在大写字母前添加空格
    .replace(/([A-Z])/g, " $1")
    // 处理下划线和破折号
    .replace(/[_-]/g, " ")
    // 确保首字母大写
    .replace(/^\w/, (c) => c.toUpperCase())
    // 移除多余空格
    .trim();

  return formatted;
}

/**
 * 根据数据获取默认配置
 * @param data 数据数组
 * @param type 图表类型
 * @returns 图表配置
 */
export function getDefaultConfigFromData(
  data: any[],
  type: "line" | "area" | "bar" | "pie"
) {
  if (!data || data.length === 0) {
    return null;
  }

  const fields = Object.keys(data[0]);

  if (type === "pie") {
    // 饼图默认选第一个字段作为标签，第二个字段作为值
    const labelField = fields[0] || "label";
    const valueField = fields[1] || "value";

    // 获取所有唯一标签
    const uniqueLabels = Array.from(
      new Set(data.map((item) => item[labelField]))
    );

    // 为每个标签分配颜色
    const colors = getColors(uniqueLabels.length).map((color, index) => ({
      name: String(uniqueLabels[index]),
      color,
    }));

    return {
      type: "pie" as const,
      title: `${formatLabel(labelField)} 分布`,
      label: {
        field: labelField,
      },
      value: {
        field: valueField,
      },
      colors,
    };
  } else {
    // 笛卡尔坐标系图表
    const xField = fields[0] || "x";
    const yField = fields[1] || "y";

    return {
      type: type as "line" | "area" | "bar",
      title: `${formatLabel(yField)} by ${formatLabel(xField)}`,
      xAxis: {
        field: xField,
        label: formatLabel(xField),
      },
      series: [
        {
          field: yField,
          label: formatLabel(yField),
          color: tailwindColors[0].value,
        },
      ],
    };
  }
}
