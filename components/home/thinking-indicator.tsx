"use client";

import React, { useState, useEffect } from "react";
import { Bot, Loader2 } from "lucide-react";

interface ThinkingIndicatorProps {
  thinking: string;
  isThinking: boolean;
}

export function ThinkingIndicator({
  thinking,
  isThinking,
}: ThinkingIndicatorProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 打字机效果
  useEffect(() => {
    if (thinking && currentIndex < thinking.length) {
      const timer = setTimeout(() => {
        setDisplayedText(thinking.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20);

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
    <div className="flex justify-start mb-6">
      <div className="flex items-start gap-3 max-w-[90%] w-full">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="bg-muted rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs text-muted-foreground">
                AI正在思考...
              </span>
            </div>
            {displayedText && (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {displayedText}
                {isThinking && <span className="animate-pulse">|</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
