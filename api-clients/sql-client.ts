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
  executeQuery: async (
    sql: string,
    opts?: { entityType?: string; entityName?: string }
  ): Promise<
    ApiResponse<
      | TableData[]
      | {
          data: TableData[];
          entityType?: string | null;
          entityName?: string | null;
        }
    >
  > => {
    const response = await fetch(`${BACKEND_URL}/api/sql-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql,
        entityType: opts?.entityType,
        entityName: opts?.entityName,
      }),
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
  fttrCheck: async (params: {
    erjiFenGuang?: string;
    onuMingCheng?: string;
  }): Promise<
    ApiResponse<{
      rows: TableData[];
      preview: TableData[];
      fileId: string;
      filename: string;
      downloadUrl: string;
      rowCount: number;
    }>
  > => {
    const response = await fetch(`${BACKEND_URL}/api/tasks/fttr-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        erjiFenGuang: params.erjiFenGuang,
        onuMingCheng: params.onuMingCheng,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "FTTR检查失败");
    }
    const data = await response.json();
    return { data, success: true };
  },
};
