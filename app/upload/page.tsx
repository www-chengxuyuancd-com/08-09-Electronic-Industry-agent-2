"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UploadPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<
    Record<string, File | null>
  >({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<null | {
    datasetKey: string;
    displayName: string;
    targetTable: string;
    totalRows: number;
    addedCount: number;
    updatedCount: number;
    deletedCount: number;
    filename: string;
    downloadUrl: string;
    uniqueColumns: string[];
  }>(null);

  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const isUploading = uploadingKey !== null;

  const [progress, setProgress] = useState<{
    status: string;
    stage: string;
    percent: number;
    insertedTotal: number;
    updatedTotal: number;
    totalRows: number;
  } | null>(null);

  const datasets: { key: string; title: string }[] = [
    { key: "wangguan_onu", title: "网管ONU在线清单" },
    { key: "ziguan_olt", title: "资管-OLT" },
    { key: "ziguan_olt_duankou", title: "资管-OLT端口" },
    { key: "ziguan_onu_guangmao", title: "资管-ONU光猫用户" },
    { key: "ziguan_pon_wangluo", title: "资管-PON网络连接" },
    { key: "ziguan_fenguangqi", title: "资管-分光器" },
    { key: "jiake_yewu_xinxi", title: "家客业务信息表" },
  ];

  async function fetchFiles() {
    const res = await fetch(`${backend}/api/files`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setFiles(data);
    }
  }

  useEffect(() => {
    // 初始加载一次即可，其余在上传/导入操作后手动刷新
    fetchFiles();
    return () => {};
  }, []);

  // Poll progress while uploading
  useEffect(() => {
    if (!uploadingKey) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `${backend}/api/datasets/${uploadingKey}/diff-progress`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (!stop) setProgress(data);
          if (data?.percent >= 100) return; // stop; wait for uploadDataset finally to clear state
        }
      } catch {}
      if (!stop) setTimeout(tick, 1000);
    };
    tick();
    return () => {
      stop = true;
    };
  }, [uploadingKey, backend]);

  function onPickFile(key: string, f: File | null) {
    setSelectedFiles((prev) => ({ ...prev, [key]: f }));
  }

  async function uploadDataset(key: string) {
    const f = selectedFiles[key];
    if (!f) return;
    setUploadingKey(key);
    setProgress({
      status: "receiving",
      stage: "receiving",
      percent: 0,
      insertedTotal: 0,
      updatedTotal: 0,
      totalRows: 0,
    });
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch(`${backend}/api/datasets/${key}/diff-upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        let message = "上传失败";
        try {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const err = await res.json();
            message =
              (err?.detail && (err.detail.message || err.detail)) ||
              err?.message ||
              JSON.stringify(err);
          } else {
            message = await res.text();
          }
        } catch {}
        console.error("diff-upload failed", res.status, message);
        if (typeof window !== "undefined") alert(message);
        return;
      }
      const data = await res.json();
      setDiffResult(data);
      setSelectedFiles((prev) => ({ ...prev, [key]: null }));
      await fetchFiles();
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingKey(null);
      setProgress(null);
    }
  }

  async function triggerImport(id: string) {
    await fetch(`${backend}/api/files/import/${id}`, { method: "POST" });
    await fetchFiles();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-2">
        <a href="/">
          <Button variant="secondary">返回首页</Button>
        </a>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>按数据类型上传并对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {datasets.map((ds) => (
              <div key={ds.key} className="border rounded-lg p-4 space-y-3">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">{ds.key}</div>
                  <div className="text-base font-medium">{ds.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    disabled={isUploading}
                    onChange={(e) =>
                      onPickFile(ds.key, e.target.files?.[0] ?? null)
                    }
                  />
                  <Button
                    onClick={() => uploadDataset(ds.key)}
                    disabled={isUploading || !selectedFiles[ds.key]}
                  >
                    {uploadingKey === ds.key ? "上传中..." : "上传并对比"}
                  </Button>
                </div>
                {uploadingKey === ds.key && progress && (
                  <div className="mt-2 space-y-1">
                    <div className="h-2 w-full bg-muted rounded">
                      <div
                        className="h-2 bg-primary rounded"
                        style={{
                          width: `${Math.min(
                            Math.max(progress.percent || 0, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      阶段: {progress.stage || "-"} · 阶段进度:{" "}
                      {Math.min(Math.max(progress.percent || 0, 0), 100)}% ·
                      已处理:
                      {(progress.insertedTotal ?? 0) +
                        (progress.updatedTotal ?? 0)}
                      /{progress.totalRows ?? 0} · 新增:
                      {progress.insertedTotal ?? 0} 更新:
                      {progress.updatedTotal ?? 0}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {diffResult && (
        <Card>
          <CardHeader>
            <CardTitle>对比结果 - {diffResult.displayName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">总行数</div>
                <div className="text-xl font-semibold">
                  {diffResult.totalRows}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">新增</div>
                <div className="text-xl font-semibold text-emerald-600">
                  {diffResult.addedCount}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">修改</div>
                <div className="text-xl font-semibold text-amber-600">
                  {diffResult.updatedCount}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">删除</div>
                <div className="text-xl font-semibold text-rose-600">
                  {diffResult.deletedCount}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={`${backend}${diffResult.downloadUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="default" disabled={isUploading}>
                  下载Excel ({diffResult.filename})
                </Button>
              </a>
              {diffResult.uniqueColumns?.length ? (
                <div className="text-xs text-muted-foreground">
                  当前唯一键列：{diffResult.uniqueColumns.join(", ")}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  未配置唯一键列（已临时使用首列作为键）
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>文件列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件名</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>导入表</TableHead>
                <TableHead>已导入行</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="max-w-[320px] truncate">
                    {f.filename}
                  </TableCell>
                  <TableCell>
                    {(Number(f.size_bytes) / (1024 * 1024)).toFixed(2)} MB
                  </TableCell>
                  <TableCell>{f.content_type}</TableCell>
                  <TableCell>{f.status}</TableCell>
                  <TableCell>{f.dataset_table || "-"}</TableCell>
                  <TableCell>{f.rows_imported ?? 0}</TableCell>
                  <TableCell>
                    {f.status === "uploaded" && (
                      <Button
                        size="sm"
                        onClick={() => triggerImport(f.id)}
                        disabled={isUploading}
                      >
                        导入
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
