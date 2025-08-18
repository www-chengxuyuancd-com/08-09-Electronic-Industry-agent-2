import { api, ApiResponse } from "@/lib/api-client";
import { TableData } from "@/components/charts/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
    const response = await fetch(`${BACKEND_URL}/api/sql-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "SQL查询失败");
    }

    const data = await response.json();
    return { data, success: true };
  },
  exportQuery: async (
    sql: string
  ): Promise<
    ApiResponse<{
      fileId: string;
      filename: string;
      downloadUrl: string;
      rowCount: number;
    }>
  > => {
    const response = await fetch(`${BACKEND_URL}/api/sql-query/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "导出失败");
    }
    const data = await response.json();
    return { data, success: true };
  },
};
