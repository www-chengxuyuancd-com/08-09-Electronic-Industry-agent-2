"use client";

import React, { useState, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = "请输入您的查询需求，例如：查询所有用户的信息",
  value,
  onChange,
}: ChatInputProps) {
  const [innerValue, setInnerValue] = useState<string>("");

  const currentValue = value !== undefined ? value : innerValue;
  const setValue = onChange ? onChange : setInnerValue;

  const handleSubmit = (): void => {
    if (currentValue.trim() && !disabled) {
      onSubmit(currentValue.trim());
      setValue("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <Textarea
          value={currentValue}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={disabled || !currentValue.trim()}
        size="icon"
        className="h-11 w-11 flex-shrink-0"
      >
        {disabled ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
