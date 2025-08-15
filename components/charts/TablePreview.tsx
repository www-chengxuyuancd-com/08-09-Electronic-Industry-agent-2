"use client";

import React from "react";
import { TableData } from "./types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface TablePreviewProps {
  data: TableData[];
}

export function TablePreview({ data }: TablePreviewProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">没有数据可显示</p>
      </Card>
    );
  }

  const headers = Object.keys(data[0]);

  return (
    <Card className="p-4">
      <h3 className="text-md font-medium mb-2">查询结果</h3>
      <div className="border rounded-md">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header) => (
                    <TableCell key={`${rowIndex}-${header}`}>
                      {String(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-right mt-2">
        共 {data.length} 行数据
      </p>
    </Card>
  );
}
