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
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);

  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  async function fetchFiles() {
    const res = await fetch(`${backend}/api/files`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setFiles(data);
    }
  }

  useEffect(() => {
    fetchFiles();
    const timer = setInterval(fetchFiles, 3000);
    return () => clearInterval(timer);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${backend}/api/files/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("上传失败");
      await fetchFiles();
      setFile(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  }

  async function triggerImport(id: string) {
    await fetch(`${backend}/api/files/import/${id}`, { method: "POST" });
    await fetchFiles();
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>数据上传</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 items-center">
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? "上传中..." : "上传"}
          </Button>
        </CardContent>
      </Card>

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
                      <Button size="sm" onClick={() => triggerImport(f.id)}>
                        导入CSV
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
