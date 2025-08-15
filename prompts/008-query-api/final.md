# SQL 查询 API 技术文档

## 概述

本文档描述了 BI 工具中 SQL 查询 API 的设计与实现方案。该 API 允许用户通过自定义 SQL 查询数据库并将结果用于图表渲染。

## API 规格

### 端点信息

- **方法**: POST
- **路径**: `/api/sql-query`
- **功能**: 执行 SQL 查询并返回结果

### 请求格式

```typescript
interface SqlQueryRequest {
  sql: string; // SQL查询语句
}
```

### 响应格式

遵循项目标准响应结构:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

查询结果将以 TableData 数组形式返回:

```typescript
interface TableData {
  [key: string]: string | number | boolean | null;
}

// 成功响应示例
{
  "success": true,
  "data": [
    { "id": 1, "name": "产品A", "sales": 1200 },
    { "id": 2, "name": "产品B", "sales": 1500 }
  ]
}
```

## 实现方案

### 1. 数据库配置

使用 Prisma 作为 ORM 工具连接 PostgreSQL 数据库:

1. 环境变量配置(.env 文件):

```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

2. Prisma 配置(prisma/schema.prisma):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 后续根据实际需求定义数据模型
```

### 2. API 路由实现

按照项目标准，实现 API 路由:

```typescript
// app/api/sql-query/route.ts
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createSuccessResponse, withErrorHandling } from "@/lib/error-wrapper";

const prisma = new PrismaClient();

async function handlePost(req: NextRequest) {
  const body = await req.json();
  const { sql } = body;

  // 执行原始SQL查询
  const results = await prisma.$queryRawUnsafe(sql);

  // 返回标准响应
  return createSuccessResponse({
    message: "查询成功",
    data: results,
  });
}

export const POST = withErrorHandling(handlePost);
```

### 3. API 客户端实现

在前端创建 API 客户端模块:

```typescript
// api-clients/sql-client.ts
import { api, ApiResponse } from "@/lib/api-client";
import { TableData } from "@/components/charts/types";

/**
 * SQL查询客户端
 */
export const sqlClient = {
  /**
   * 执行SQL查询
   * @param sql SQL查询语句
   * @returns 查询结果
   */
  executeQuery: async (sql: string): Promise<ApiResponse<TableData[]>> => {
    return api.post<TableData[]>("/api/sql-query", { sql });
  },
};
```

### 4. 前端组件集成示例

```typescript
"use client";

import { useState } from "react";
import { sqlClient } from "@/api-clients/sql-client";
import { TableData } from "@/components/charts/types";
import { toast } from "sonner";

export function SqlQueryComponent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExecuteQuery = async () => {
    setLoading(true);
    try {
      const response = await sqlClient.executeQuery(query);

      if (response.success && response.data) {
        setResults(response.data);
        toast.success("查询成功");
      } else {
        toast.error("查询失败", {
          description: response.error?.message || "未知错误",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 组件渲染...
}
```
