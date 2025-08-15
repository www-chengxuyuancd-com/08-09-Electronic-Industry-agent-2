# 表格查询结果集成图表可视化方案

## 需求概述

在 `/demo/query` 路径的表格查询结果下方集成图表可视化功能，支持多种图表类型（折线图、面积图、柱状图、饼图），并通过 ChartConfigEditor 组件提供图表配置能力。

## 技术方案

### 1. 架构设计

```
QueryPage
├── QueryForm
├── ResultTable
└── ChartVisualization
    ├── ChartConfigEditor
    │   ├── ChartTypeSelector
    │   ├── DataSeriesMapper
    │   └── StyleConfigurator
    └── ChartRenderer
```

### 2. 数据流

1. 用户在 QueryForm 执行查询
2. 查询结果数据同时传递给 ResultTable 和 ChartVisualization
3. ChartVisualization 组件负责数据转换和图表渲染
4. 用户可通过 ChartConfigEditor 调整图表配置

### 3. 核心组件实现

#### ChartVisualization 组件

```tsx
// 负责协调图表配置和渲染
interface ChartVisualizationProps {
  data: any[]; // 查询结果数据
}

const ChartVisualization = ({ data }: ChartVisualizationProps) => {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: "line",
    xAxisField: "",
    yAxisFields: [],
    colors: [],
    showLegend: true,
  });

  const handleConfigChange = (newConfig: Partial<ChartConfig>) => {
    setChartConfig((prev) => ({ ...prev, ...newConfig }));
  };

  return (
    <div className="mt-6 space-y-4">
      <ChartConfigEditor
        data={data}
        config={chartConfig}
        onConfigChange={handleConfigChange}
      />
      <ChartRenderer data={data} config={chartConfig} />
    </div>
  );
};
```

#### ChartConfigEditor 组件

```tsx
// 提供图表配置界面
interface ChartConfigEditorProps {
  data: any[];
  config: ChartConfig;
  onConfigChange: (config: Partial<ChartConfig>) => void;
}

const ChartConfigEditor = ({
  data,
  config,
  onConfigChange,
}: ChartConfigEditorProps) => {
  const columns = useMemo(() => {
    return Object.keys(data[0] || {});
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>图表配置</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ChartTypeSelector
            value={config.type}
            onChange={(type) => onConfigChange({ type })}
          />

          <DataSeriesMapper
            columns={columns}
            config={config}
            onConfigChange={onConfigChange}
          />

          <StyleConfigurator config={config} onConfigChange={onConfigChange} />
        </div>
      </CardContent>
    </Card>
  );
};
```

#### ChartRenderer 组件

```tsx
// 负责根据配置渲染不同类型的图表
interface ChartRendererProps {
  data: any[];
  config: ChartConfig;
}

const ChartRenderer = ({ data, config }: ChartRendererProps) => {
  const chartData = useMemo(() => {
    // 根据配置转换数据为图表所需格式
    return transformDataForChart(data, config);
  }, [data, config]);

  // 根据图表类型选择渲染组件
  switch (config.type) {
    case "line":
      return <LineChart data={chartData} config={config} />;
    case "area":
      return <AreaChart data={chartData} config={config} />;
    case "bar":
      return <BarChart data={chartData} config={config} />;
    case "pie":
      return <PieChart data={chartData} config={config} />;
    default:
      return <div>请选择图表类型</div>;
  }
};
```

### 4. 技术选型

- 图表库: Recharts（React 集成，易用性高，支持响应式）
- 状态管理: React Hooks（useState, useMemo）
- UI 组件: shadcn/ui（保持设计一致性）

### 5. 实现要点

#### 数据转换

为不同图表类型提供适当的数据转换逻辑，确保数据格式符合图表库要求：

```tsx
const transformDataForChart = (data: any[], config: ChartConfig) => {
  if (config.type === "pie") {
    return data.map((item) => ({
      name: item[config.labelField],
      value: Number(item[config.valueField]),
    }));
  }

  // 对于线图、面积图和柱状图，保持原始数据结构
  // 但确保数值字段已转换为数字类型
  return data.map((item) => {
    const result = { ...item };
    config.yAxisFields.forEach((field) => {
      result[field] = Number(result[field]);
    });
    return result;
  });
};
```

#### 图表类型切换

提供直观的图表类型选择器，实现无缝切换：

```tsx
const ChartTypeSelector = ({ value, onChange }) => {
  const chartTypes = [
    { value: "line", label: "折线图", icon: <LineChartIcon /> },
    { value: "area", label: "面积图", icon: <AreaChartIcon /> },
    { value: "bar", label: "柱状图", icon: <BarChartIcon /> },
    { value: "pie", label: "饼图", icon: <PieChartIcon /> },
  ];

  return (
    <div className="flex space-x-2">
      {chartTypes.map((type) => (
        <Button
          key={type.value}
          variant={value === type.value ? "default" : "outline"}
          onClick={() => onChange(type.value)}
          className="flex items-center gap-2"
        >
          {type.icon}
          {type.label}
        </Button>
      ))}
    </div>
  );
};
```

### 6. 集成到查询页面

修改 `/demo/query` 页面，将 ChartVisualization 组件集成到查询结果下方：

```tsx
export default function QueryPage() {
  const [queryResult, setQueryResult] = useState<any[]>([]);

  const handleQuerySubmit = async (queryParams) => {
    const result = await fetchQueryResults(queryParams);
    setQueryResult(result);
  };

  return (
    <div className="container py-6 space-y-6">
      <QueryForm onSubmit={handleQuerySubmit} />

      {queryResult.length > 0 && (
        <>
          <ResultTable data={queryResult} />
          <ChartVisualization data={queryResult} />
        </>
      )}
    </div>
  );
}
```

## 扩展性考虑

1. 支持导出图表为图片或 PDF
2. 支持保存图表配置为模板
3. 提供更多图表类型（散点图、热力图等）
4. 增加数据过滤功能，允许用户选择部分数据进行可视化
