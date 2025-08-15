我需要开发一个功能，可以将任何的 table，通过低代码的方式配置，显示为不同的图表

## 图表参考

```
components/demo/area-chart.tsx
components/demo/bar-chart.tsx
components/demo/line-chart.tsx
components/demo/pie-chart.tsx
```

## 图表配置

### line area bar chart

- x 轴选取的字段
- 可以配置多个 series
- 每个 series 可配置颜色

### pie chart

- label 选取的字段
- value 选取的字段
- 不同 value 对应的颜色

## 目标

封装为一个组件，用于渲染不同的 charts

参数：

- table 的数据，你需要帮我定义格式
- chart config，配置如何从 table 数据渲染 charts，你需要帮我定义格式
