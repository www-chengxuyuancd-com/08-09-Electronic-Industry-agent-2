import { useState, useCallback } from "react";
import { sqlClient } from "@/api-clients/sql-client";
import { TableData } from "@/components/charts/types";

interface UseSqlQueryReturn {
  queryResults: TableData[];
  recommendations: TableData[];
  queryError: string | null;
  isExecuting: boolean;
  entityType?: string;
  entityName?: string;
  executeQuery: (
    sql: string,
    opts?: { entityType?: string; entityName?: string }
  ) => Promise<void>;
  clearResults: () => void;
}

export function useSqlQuery(): UseSqlQueryReturn {
  const [queryResults, setQueryResults] = useState<TableData[]>([]);
  const [recommendations, setRecommendations] = useState<TableData[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const [entityName, setEntityName] = useState<string | undefined>(undefined);

  const clearResults = useCallback(() => {
    setQueryResults([]);
    setRecommendations([]);
    setQueryError(null);
  }, []);

  const executeQuery = useCallback(
    async (
      sql: string,
      opts?: { entityType?: string; entityName?: string }
    ) => {
      if (!sql.trim()) return;

      setIsExecuting(true);
      setQueryError(null);

      try {
        const response = await sqlClient.executeQuery(sql, opts);

        if (response.success && response.data) {
          const payload: any = response.data;
          const rows: TableData[] = Array.isArray(payload)
            ? payload
            : payload.data || [];
          setQueryResults(rows);
          const recs: TableData[] = Array.isArray(payload)
            ? []
            : payload.recommendations || [];
          setRecommendations(recs);
          if (!Array.isArray(payload)) {
            setEntityType(payload.entityType || opts?.entityType);
            setEntityName(payload.entityName || opts?.entityName);
          } else {
            setEntityType(opts?.entityType);
            setEntityName(opts?.entityName);
          }
          setQueryError(null);
        } else {
          const errorMessage =
            response.error?.message || "查询失败，请检查SQL语句";
          const errorStatus = response.error?.status
            ? `(状态码: ${response.error.status})`
            : "";
          setQueryError(`${errorMessage} ${errorStatus}`.trim());
          setQueryResults([]);
          setRecommendations([]);
          setEntityType(undefined);
          setEntityName(undefined);
        }
      } catch (err) {
        console.error("查询执行错误:", err);
        setQueryError("执行查询时发生错误");
        setQueryResults([]);
        setRecommendations([]);
        setEntityType(undefined);
        setEntityName(undefined);
      } finally {
        setIsExecuting(false);
      }
    },
    []
  );

  return {
    queryResults,
    recommendations,
    queryError,
    isExecuting,
    entityType,
    entityName,
    executeQuery,
    clearResults,
  };
}
