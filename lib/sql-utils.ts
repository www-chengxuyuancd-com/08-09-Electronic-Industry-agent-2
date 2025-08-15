/**
 * SQL工具函数
 */

/**
 * 清理SQL查询语句
 * 去除markdown代码块标记、多余的空白字符等
 */
export function cleanSqlQuery(sql: string): string {
  if (!sql || typeof sql !== "string") {
    return "";
  }

  let cleanedSql = sql.trim();

  // 去除markdown代码块标记
  if (cleanedSql.startsWith("```sql") || cleanedSql.startsWith("```")) {
    cleanedSql = cleanedSql.replace(/^```(sql)?\n?/, "").replace(/\n?```$/, "");
  }

  // 去除行首行尾的空白字符
  cleanedSql = cleanedSql.trim();

  // 去除多余的换行符（保持SQL的可读性）
  cleanedSql = cleanedSql.replace(/\n\s*\n/g, "\n");

  return cleanedSql;
}

/**
 * 基本的SQL验证
 * 检查是否包含危险的SQL操作
 */
export function validateSqlQuery(sql: string): {
  isValid: boolean;
  error?: string;
} {
  if (!sql || typeof sql !== "string") {
    return { isValid: false, error: "SQL查询语句不能为空" };
  }

  const cleanedSql = cleanSqlQuery(sql).toLowerCase();

  if (!cleanedSql) {
    return { isValid: false, error: "SQL查询语句为空" };
  }

  // 检查是否包含危险操作（可根据需要扩展）
  const dangerousOperations = [
    "drop table",
    "drop database",
    "truncate",
    "delete from",
    "update ",
    "insert into",
    "alter table",
    "create table",
    "create database",
  ];

  for (const operation of dangerousOperations) {
    if (cleanedSql.includes(operation)) {
      return {
        isValid: false,
        error: `不允许执行 ${operation.toUpperCase()} 操作，仅支持查询操作`,
      };
    }
  }

  // 检查是否以SELECT开头（基本的查询验证）
  if (!cleanedSql.startsWith("select") && !cleanedSql.startsWith("with")) {
    return {
      isValid: false,
      error: "仅支持 SELECT 查询语句",
    };
  }

  return { isValid: true };
}

/**
 * 格式化SQL查询语句（简单格式化）
 */
export function formatSqlQuery(sql: string): string {
  const cleanedSql = cleanSqlQuery(sql);

  if (!cleanedSql) {
    return "";
  }

  // 简单的SQL格式化
  return cleanedSql
    .replace(/\s+/g, " ")
    .replace(/,\s*/g, ",\n  ")
    .replace(/\bFROM\b/gi, "\nFROM")
    .replace(/\bWHERE\b/gi, "\nWHERE")
    .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
    .replace(/\bORDER BY\b/gi, "\nORDER BY")
    .replace(/\bHAVING\b/gi, "\nHAVING")
    .replace(/\bLIMIT\b/gi, "\nLIMIT")
    .trim();
}
