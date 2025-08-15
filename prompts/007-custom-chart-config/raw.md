需求：开发一个新组件，用于编辑 chart config

## 参考

`app/chart-example/page.tsx` 这个文件是一个使用示例

## 需要支持的功能

可以将任意的 table 数据转化为图表

- 配置所有图表类型："line" | "area" | "bar" | "pie"
- 传入参数需要有 table 数据

## 调试

创建一个新页面，以便我调试这个组件

- 提供一些测试 table 数据，数据存储在一个单独的 ts 文件中，我可以切换不同的测试数据
- 页面要预览这个 table 的数据
- 页面上要提供 chart config 编辑器
- 页面上要提供 ChartRenderer，实时应用 chart config 的变化
