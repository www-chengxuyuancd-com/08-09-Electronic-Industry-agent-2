"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Brain } from "lucide-react";

interface ThinkingProcessProps {
  thinking: string;
  isThinking: boolean;
  isComplete: boolean;
}

export function ThinkingProcess({
  thinking,
  isThinking,
  isComplete,
}: ThinkingProcessProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 打字机效果
  useEffect(() => {
    if (thinking && currentIndex < thinking.length) {
      const timer = setTimeout(() => {
        setDisplayedText(thinking.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20); // 调整速度

      return () => clearTimeout(timer);
    }
  }, [thinking, currentIndex]);

  // 重置状态当新的思考开始时
  useEffect(() => {
    if (isThinking && thinking !== displayedText) {
      setDisplayedText("");
      setCurrentIndex(0);
    }
  }, [isThinking, thinking, displayedText]);

  if (!isThinking && !thinking) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {isThinking && !isComplete ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          AI 思考过程
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {displayedText}
          {isThinking && !isComplete && (
            <span className="animate-pulse">|</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
