"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { testDataList } from "./test-data";

interface DataSwitcherProps {
  value: string;
  onChange: (value: string) => void;
}

export function DataSwitcher({ value, onChange }: DataSwitcherProps) {
  const dataKeys = Object.keys(testDataList);

  return (
    <Card className="p-4">
      <h3 className="text-md font-medium mb-2">选择数据集</h3>
      <div className="flex flex-wrap gap-2">
        {dataKeys.map((key) => (
          <Button
            key={key}
            variant={value === key ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(key)}
          >
            {key === "sales" && "销售数据"}
            {key === "browser" && "浏览器数据"}
            {key === "product" && "产品数据"}
          </Button>
        ))}
      </div>
    </Card>
  );
}
