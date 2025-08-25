import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { callLLM } from "@/api-clients/llm-api";
import { LLMModelType } from "@/types/llm";
import { cleanSqlQuery } from "@/lib/sql-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface LLMQueryInputProps {
  onSqlGenerated: (sql: string) => void;
  onUserInput?: (text: string) => void;
}

export function LLMQueryInput({
  onSqlGenerated,
  onUserInput,
}: LLMQueryInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelType, setModelType] = useState<LLMModelType>("gemini");

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await callLLM({
        userInput: input,
        modelType,
      });

      const cleanSql = cleanSqlQuery(result.sql);
      if (onUserInput) {
        onUserInput(input);
      }
      onSqlGenerated(cleanSql);
    } catch (error: unknown) {
      console.error("LLM查询失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : "生成SQL失败";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">自然语言生成SQL</h2>

      <div className="space-y-4 mb-4">
        <div>
          <Label htmlFor="model-type">LLM模型类型</Label>
          <Select
            value={modelType}
            onValueChange={(value: LLMModelType) => setModelType(value)}
          >
            <SelectTrigger id="model-type" className="w-full">
              <SelectValue placeholder="选择LLM模型类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="gemini">Google Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="natural-language-query">自然语言查询</Label>
          <Textarea
            id="natural-language-query"
            placeholder="例如：查询最近30天内的销售数据，按照产品类别分组"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-24"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive p-3 rounded-md mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isLoading || !input.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            "生成SQL"
          )}
        </Button>
      </div>
    </Card>
  );
}
