本项目是一个 BI 工具，用户可以自定义 SQL 查询出任何的 table 数据，并通过低代码配置来转换为不同的图表

现在我需要开发一个 API，用于使用 SQL 查询数据库

## API 定义

- method: POST
- path: /sql-query
- request body:
  - sql text
- response body:
  - data in json format

## 类型定义

查询出的数据会在前端转换为 TableData

```
interface TableData {
  [key: string]: string | number | boolean | null;
}
```

需要便于转换

## 数据库配置

目前本项目还未接入任何数据库和 ORM 框架

我希望在 env 文件中配置数据库连接信息

我的数据库是 postgres，我希望使用 prisma
