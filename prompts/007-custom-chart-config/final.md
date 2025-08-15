# Chart Config 编辑器技术方案

## 目标

开发一个可编辑图表配置的 React 组件 ChartConfigEditor，支持多种图表类型（line/area/bar/pie），可接收任意 table 数据

## 组件设计

### ChartConfigEditor

- 位置：`@/components/charts/ChartConfigEditor.tsx`
- 作用：可视化编辑图表配置（ChartConfig），支持所有类型
- Props：
  ```ts
  interface ChartConfigEditorProps {
    data: TableData[]; // 表格数据
    value: ChartConfig; // 当前配置
    onChange: (config: ChartConfig) => void; // 配置变更回调
  }
  ```
- 功能：
  - 选择图表类型（line/area/bar/pie）
  - 根据类型动态渲染配置项（如 xAxis/series/label/value/colors）
  - 字段选择器自动从 data 推断字段
  - 支持颜色选择、系列增删

## 演示页面示例

```tsx
// app/chart-config-demo/page.tsx
"use client";
import { useState } from "react";
import { testDataList } from "@/components/charts/test-data";
import { ChartConfigEditor } from "@/components/charts/ChartConfigEditor";
import { ChartRenderer } from "@/components/charts";

export default function ChartConfigDemoPage() {
  const [dataKey, setDataKey] = useState("sales");
  const [config, setConfig] = useState<ChartConfig>(/* 默认配置 */);
  const data = testDataList[dataKey];
  return (
    <div className="container py-8 grid gap-6">
      {/* 数据切换器 */}
      {/* <DataSwitcher ... /> */}
      <TablePreview data={data} />
      <ChartConfigEditor data={data} value={config} onChange={setConfig} />
      <ChartRenderer data={data} config={config} />
    </div>
  );
}
```

## 其他说明

- UI 组件优先用 shadcn/ui
- 类型、接口定义全部放在 `@/components/charts/types.ts`
- 组件分层清晰，便于复用
