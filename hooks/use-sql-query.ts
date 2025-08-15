import { useState, useCallback } from "react";
import { sqlClient } from "@/api-clients/sql-client";
import { TableData } from "@/components/charts/types";

interface UseSqlQueryReturn {
  queryResults: TableData[];
  queryError: string | null;
  isExecuting: boolean;
  executeQuery: (sql: string) => Promise<void>;
  clearResults: () => void;
}

export function useSqlQuery(): UseSqlQueryReturn {
  const [queryResults, setQueryResults] = useState<TableData[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const clearResults = useCallback(() => {
    setQueryResults([]);
    setQueryError(null);
  }, []);

  const executeQuery = useCallback(async (sql: string) => {
    if (!sql.trim()) return;

    setIsExecuting(true);
    setQueryError(null);

    try {
      const response = await sqlClient.executeQuery(sql);

      if (response.success && response.data) {
        setQueryResults(response.data);
        setQueryError(null);
      } else {
        const errorMessage =
          response.error?.message || "查询失败，请检查SQL语句";
        const errorStatus = response.error?.status
          ? `(状态码: ${response.error.status})`
          : "";
        setQueryError(`${errorMessage} ${errorStatus}`.trim());
        setQueryResults([]);
      }
    } catch (err) {
      console.error("查询执行错误:", err);
      setQueryError("执行查询时发生错误");
      setQueryResults([]);
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return {
    queryResults,
    queryError,
    isExecuting,
    executeQuery,
    clearResults,
  };
}
