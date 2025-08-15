# SQL 查询功能改进

## 问题描述

在使用 Prisma 的`$queryRawUnsafe()`执行 SQL 查询时，遇到了以下错误：

````
SQL查询错误: Invalid `prisma.$queryRawUnsafe()` invocation: Raw query failed. Code: `42601`. Message: `ERROR: syntax error at or near "```"` (状态码: 400)
````

这个错误是由于 LLM 生成的 SQL 语句包含了 markdown 代码块标记（```sql），而这些标记被直接传递给了数据库执行。

## 解决方案

### 1. 创建 SQL 工具函数 (`lib/sql-utils.ts`)

创建了一个专门的工具函数库，包含以下功能：

- **`cleanSqlQuery(sql: string)`**: 清理 SQL 查询语句

  - 去除 markdown 代码块标记（`sql 和 `）
  - 去除多余的空白字符和换行符
  - 保持 SQL 的可读性

- **`validateSqlQuery(sql: string)`**: 验证 SQL 查询语句

  - 检查是否为空
  - 验证是否为安全的 SELECT 查询
  - 阻止危险操作（DROP、DELETE、UPDATE、INSERT 等）

- **`formatSqlQuery(sql: string)`**: 格式化 SQL 查询语句
  - 简单的 SQL 格式化功能

### 2. 更新后端 API (`app/api/sql-query/route.ts`)

在后端 API 中添加了 SQL 清理和验证逻辑：

```typescript
// 清理SQL查询语句
const cleanedSql = cleanSqlQuery(sql);

// 验证SQL查询语句
const validation = validateSqlQuery(cleanedSql);
if (!validation.isValid) {
  return createErrorResponse(
    "INVALID_SQL",
    validation.error || "SQL查询语句无效"
  );
}

// 执行清理后的SQL
const results = await prisma.$queryRawUnsafe(cleanedSql);
```

### 3. 更新前端组件

在前端 LLM 组件中也添加了 SQL 清理逻辑作为双重保障：

```typescript
const cleanSql = cleanSqlQuery(result.sql);
onSqlGenerated(cleanSql);
```

### 4. 改进类型安全

将所有`any`类型替换为更具体的类型，提高代码的类型安全性。

## 功能特性

### SQL 清理功能

- ✅ 去除 markdown 代码块标记
- ✅ 去除多余的空白字符
- ✅ 保持 SQL 可读性
- ✅ 处理各种边界情况（null、undefined、空字符串）

### SQL 验证功能

- ✅ 只允许 SELECT 和 WITH 查询
- ✅ 阻止危险的数据修改操作
- ✅ 提供详细的错误信息

### 安全性

- ✅ 防止 SQL 注入攻击
- ✅ 限制只能执行查询操作
- ✅ 输入验证和清理

## 测试

创建了测试页面 `/test-sql-clean` 来验证 SQL 清理功能，包含以下测试用例：

1. 带有 markdown 代码块的 SQL
2. 不带 sql 标签的代码块
3. 带有多余空白的 SQL
4. 危险的 SQL 操作
5. 正常的 SELECT 查询

## 使用方法

### 在代码中使用

```typescript
import { cleanSqlQuery, validateSqlQuery } from "@/lib/sql-utils";

// 清理SQL
const cleanedSql = cleanSqlQuery(rawSql);

// 验证SQL
const validation = validateSqlQuery(cleanedSql);
if (!validation.isValid) {
  console.error(validation.error);
}
```

### API 调用

后端 API 会自动处理 SQL 清理和验证，前端只需要正常调用即可：

```typescript
const response = await sqlClient.executeQuery(sql);
```

## 兼容性

- ✅ 向后兼容现有代码
- ✅ 不影响正常的 SQL 查询
- ✅ 自动处理 LLM 生成的各种格式

## 注意事项

1. 该功能主要针对 LLM 生成的 SQL 进行清理
2. 仍然建议在 LLM prompt 中明确指示不要生成代码块标记
3. 验证功能可以根据需要进行扩展
4. 建议在生产环境中进一步加强 SQL 安全验证
