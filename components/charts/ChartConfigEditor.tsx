"use client";

import React, { useEffect, useState } from "react";
import {
  ChartConfig,
  TableData,
  CartesianChartConfig,
  PieChartConfig,
} from "./types";
import { defaultChartConfigs } from "./test-data";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  formatLabel,
  getColors,
  getDefaultConfigFromData,
  tailwindColors,
} from "./chart-utils";

export interface ChartConfigEditorProps {
  data: TableData[];
  value: ChartConfig;
  onChange: (config: ChartConfig) => void;
}

export function ChartConfigEditor({
  data,
  value,
  onChange,
}: ChartConfigEditorProps) {
  const [chartType, setChartType] = useState<"line" | "area" | "bar" | "pie">(
    value.type
  );
  const [config, setConfig] = useState<ChartConfig>(value);

  // 检测数据字段
  const dataFields = data.length > 0 ? Object.keys(data[0]) : [];

  // 图表类型改变时，设置默认配置
  useEffect(() => {
    if (chartType !== value.type) {
      // 使用智能默认配置，基于数据自动设置字段
      const defaultConfig = getDefaultConfigFromData(data, chartType);
      if (defaultConfig) {
        onChange(defaultConfig);
        setConfig(defaultConfig);
      } else {
        // 如果无法从数据生成配置，则使用预设默认配置
        const newConfig = { ...defaultChartConfigs[chartType] };
        onChange(newConfig);
        setConfig(newConfig);
      }
    }
  }, [chartType, onChange, value.type, data]);

  // 更新配置
  const updateConfig = (newConfig: ChartConfig) => {
    setConfig(newConfig);
    onChange(newConfig);
  };

  // 更新标题
  const updateTitle = (title: string) => {
    updateConfig({ ...config, title });
  };

  // 更新坐标轴字段
  const updateXAxisField = (field: string) => {
    if (config.type === "pie") return;

    const cartesianConfig = { ...config } as CartesianChartConfig;
    cartesianConfig.xAxis.field = field;
    // 默认将标签设置为格式化后的字段名
    cartesianConfig.xAxis.label = formatLabel(field);
    updateConfig(cartesianConfig);
  };

  // 更新坐标轴标签
  const updateXAxisLabel = (label: string) => {
    if (config.type === "pie") return;

    const cartesianConfig = { ...config } as CartesianChartConfig;
    cartesianConfig.xAxis.label = label;
    updateConfig(cartesianConfig);
  };

  // 更新系列字段
  const updateSeriesField = (index: number, field: string) => {
    if (config.type === "pie") return;

    const cartesianConfig = { ...config } as CartesianChartConfig;
    cartesianConfig.series[index].field = field;
    // 默认将标签设置为格式化后的字段名
    cartesianConfig.series[index].label = formatLabel(field);
    updateConfig(cartesianConfig);
  };

  // 更新系列标签
  const updateSeriesLabel = (index: number, label: string) => {
    if (config.type === "pie") return;

    const cartesianConfig = { ...config } as CartesianChartConfig;
    cartesianConfig.series[index].label = label;
    updateConfig(cartesianConfig);
  };

  // 更新系列颜色
  const updateSeriesColor = (index: number, color: string) => {
    if (config.type === "pie") return;

    const cartesianConfig = { ...config } as CartesianChartConfig;
    cartesianConfig.series[index].color = color;
    updateConfig(cartesianConfig);
  };

  // 添加新系列
  const addSeries = () => {
    if (config.type === "pie") return;

    const cartesianConfig = { ...config } as CartesianChartConfig;
    const availableFields = dataFields.filter(
      (field) =>
        field !== cartesianConfig.xAxis.field &&
        !cartesianConfig.series.some((s) => s.field === field)
    );

    if (availableFields.length === 0) return;

    // 使用Tailwind预设颜色
    const seriesCount = cartesianConfig.series.length;
    const newColor = tailwindColors[seriesCount % tailwindColors.length].value;

    cartesianConfig.series.push({
      field: availableFields[0],
      label: formatLabel(availableFields[0]),
      color: newColor,
    });

    updateConfig(cartesianConfig);
  };

  // 删除系列
  const removeSeries = (index: number) => {
    if (config.type === "pie") return;

    const cartesianConfig = { ...config } as CartesianChartConfig;
    if (cartesianConfig.series.length <= 1) return;

    cartesianConfig.series = cartesianConfig.series.filter(
      (_, i) => i !== index
    );
    updateConfig(cartesianConfig);
  };

  // 更新饼图标签字段
  const updatePieLabelField = (field: string) => {
    if (config.type !== "pie") return;

    const pieConfig = { ...config } as PieChartConfig;
    pieConfig.label.field = field;

    // 自动更新颜色配置以匹配新的标签字段
    const uniqueLabels = Array.from(
      new Set(data.map((item) => String(item[field])))
    );

    pieConfig.colors = uniqueLabels.map((label, index) => ({
      name: label,
      color: tailwindColors[index % tailwindColors.length].value,
    }));

    updateConfig(pieConfig);
  };

  // 更新饼图值字段
  const updatePieValueField = (field: string) => {
    if (config.type !== "pie") return;

    const pieConfig = { ...config } as PieChartConfig;
    pieConfig.value.field = field;
    updateConfig(pieConfig);
  };

  // 更新饼图颜色
  const updatePieColor = (labelValue: string, color: string) => {
    if (config.type !== "pie") return;

    const pieConfig = { ...config } as PieChartConfig;
    if (!pieConfig.colors) {
      pieConfig.colors = [];
    }

    const existingColorIndex = pieConfig.colors.findIndex(
      (c) => c.name === labelValue
    );

    if (existingColorIndex >= 0) {
      // 更新已有颜色
      pieConfig.colors[existingColorIndex].color = color;
    } else {
      // 添加新颜色
      pieConfig.colors.push({ name: labelValue, color });
    }

    updateConfig(pieConfig);
  };

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">图表配置编辑器</h2>

      {/* 通用配置 */}
      <div className="mb-4">
        <Label htmlFor="chart-title">图表标题</Label>
        <Input
          id="chart-title"
          value={config.title || ""}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="输入图表标题"
          className="mt-1"
        />
      </div>

      {/* 图表类型选择 */}
      <div className="mb-4">
        <Label>图表类型</Label>
        <Tabs
          value={chartType}
          onValueChange={(value) => setChartType(value as any)}
          className="mt-1"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="line">线图</TabsTrigger>
            <TabsTrigger value="area">面积图</TabsTrigger>
            <TabsTrigger value="bar">柱状图</TabsTrigger>
            <TabsTrigger value="pie">饼图</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator className="my-4" />

      {/* 笛卡尔坐标系图表配置 (线图/面积图/柱状图) */}
      {config.type !== "pie" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="x-axis-field">X轴字段</Label>
              <Select
                value={(config as CartesianChartConfig).xAxis.field}
                onValueChange={updateXAxisField}
              >
                <SelectTrigger id="x-axis-field">
                  <SelectValue placeholder="选择X轴字段" />
                </SelectTrigger>
                <SelectContent>
                  {dataFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="x-axis-label">X轴标签</Label>
              <Input
                id="x-axis-label"
                value={(config as CartesianChartConfig).xAxis.label || ""}
                onChange={(e) => updateXAxisLabel(e.target.value)}
                placeholder="X轴标签"
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium">数据系列</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addSeries}
                disabled={
                  dataFields.length <=
                  (config as CartesianChartConfig).series.length + 1
                }
              >
                <PlusCircle className="h-4 w-4 mr-1" /> 添加系列
              </Button>
            </div>

            {(config as CartesianChartConfig).series.map((series, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md"
              >
                <div className="col-span-4">
                  <Label htmlFor={`series-field-${index}`}>数据字段</Label>
                  <Select
                    value={series.field}
                    onValueChange={(value) => updateSeriesField(index, value)}
                  >
                    <SelectTrigger id={`series-field-${index}`}>
                      <SelectValue placeholder="选择字段" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataFields
                        .filter(
                          (field) =>
                            field !==
                            (config as CartesianChartConfig).xAxis.field
                        )
                        .map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-4">
                  <Label htmlFor={`series-label-${index}`}>显示名称</Label>
                  <Input
                    id={`series-label-${index}`}
                    value={series.label || ""}
                    onChange={(e) => updateSeriesLabel(index, e.target.value)}
                    placeholder="系列名称"
                  />
                </div>

                <div className="col-span-3">
                  <Label htmlFor={`series-color-${index}`}>颜色</Label>
                  <Select
                    value={series.color || ""}
                    onValueChange={(value) => updateSeriesColor(index, value)}
                  >
                    <SelectTrigger
                      id={`series-color-select-${index}`}
                      className="w-full"
                    >
                      <SelectValue placeholder="选择颜色" />
                    </SelectTrigger>
                    <SelectContent>
                      {tailwindColors.map((color) => (
                        <SelectItem key={color.name} value={color.value}>
                          <div className="flex items-center">
                            <div
                              className="h-4 w-4 rounded-full mr-2"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSeries(index)}
                    disabled={
                      (config as CartesianChartConfig).series.length <= 1
                    }
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 饼图配置 */}
      {config.type === "pie" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pie-label-field">标签字段</Label>
              <Select
                value={(config as PieChartConfig).label.field}
                onValueChange={updatePieLabelField}
              >
                <SelectTrigger id="pie-label-field">
                  <SelectValue placeholder="选择标签字段" />
                </SelectTrigger>
                <SelectContent>
                  {dataFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pie-value-field">值字段</Label>
              <Select
                value={(config as PieChartConfig).value.field}
                onValueChange={updatePieValueField}
              >
                <SelectTrigger id="pie-value-field">
                  <SelectValue placeholder="选择值字段" />
                </SelectTrigger>
                <SelectContent>
                  {dataFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <h3 className="text-md font-medium">颜色配置</h3>

            {data
              .filter((_, index) => index < 10) // 限制最多显示10个类别
              .map((item, index) => {
                const labelField = (config as PieChartConfig).label.field;
                const labelValue = String(item[labelField]);
                const pieConfig = config as PieChartConfig;
                const colorConfig = pieConfig.colors?.find(
                  (c) => c.name === labelValue
                );

                return (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-5">
                      <Label>{labelValue}</Label>
                    </div>
                    <div className="col-span-7">
                      <Select
                        value={colorConfig?.color || ""}
                        onValueChange={(value) =>
                          updatePieColor(labelValue, value)
                        }
                      >
                        <SelectTrigger
                          id={`pie-color-select-${index}`}
                          className="w-full"
                        >
                          <SelectValue placeholder="选择颜色" />
                        </SelectTrigger>
                        <SelectContent>
                          {tailwindColors.map((color) => (
                            <SelectItem key={color.name} value={color.value}>
                              <div className="flex items-center">
                                <div
                                  className="h-4 w-4 rounded-full mr-2"
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </Card>
  );
}
