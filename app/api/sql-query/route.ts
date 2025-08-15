import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cleanSqlQuery, validateSqlQuery } from "@/lib/sql-utils";

const prisma = new PrismaClient();

/**
 * 处理BigInt和PostgreSQL Timestamp序列化
 * 将所有BigInt转换为字符串，将Timestamp转换为ISO字符串
 */
const serializeBigInt = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return data.toString();
  }

  // 处理Date对象或PostgreSQL timestamp
  if (
    data instanceof Date ||
    (typeof data === "object" && data && "toISOString" in data)
  ) {
    return (data as Date).toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeBigInt);
  }

  if (typeof data === "object" && data !== null) {
    const result: Record<string, unknown> = {};
    for (const key in data) {
      result[key] = serializeBigInt((data as Record<string, unknown>)[key]);
    }
    return result;
  }

  return data;
};

/**
 * 创建成功响应
 */
const createSuccessResponse = (data: unknown) => {
  // 处理BigInt序列化问题
  const serializedData = serializeBigInt(data);

  return NextResponse.json(serializedData);
};

/**
 * 创建错误响应
 */
const createErrorResponse = (code: string, message: string, status = 400) => {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
};

/**
 * 错误处理包装器
 */
const withErrorHandling = (
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error: unknown) {
      console.error("API Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "处理请求时发生错误";
      return createErrorResponse("INTERNAL_SERVER_ERROR", errorMessage, 500);
    }
  };
};

/**
 * 处理POST请求
 */
async function handlePost(req: NextRequest) {
  const body = await req.json();
  const { sql } = body;

  if (!sql) {
    return createErrorResponse("INVALID_REQUEST", "缺少SQL查询语句");
  }

  try {
    // 清理SQL查询语句
    const cleanedSql = cleanSqlQuery(sql);

    if (!cleanedSql) {
      return createErrorResponse("INVALID_REQUEST", "SQL查询语句为空");
    }

    // 验证SQL查询语句
    const validation = validateSqlQuery(cleanedSql);
    if (!validation.isValid) {
      return createErrorResponse(
        "INVALID_SQL",
        validation.error || "SQL查询语句无效"
      );
    }

    // 执行原始SQL查询
    const results = await prisma.$queryRawUnsafe(cleanedSql);

    // 返回标准响应
    return createSuccessResponse(results);
  } catch (error: unknown) {
    console.error("SQL Query Error:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return createErrorResponse("QUERY_ERROR", `SQL查询错误: ${errorMessage}`);
  }
}

export const POST = withErrorHandling(handlePost);
