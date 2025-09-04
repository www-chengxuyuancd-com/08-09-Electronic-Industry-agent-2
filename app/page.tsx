"use client";

import { ChatInterface } from "@/components/home/chat-interface";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import React from "react";

export default function Home() {
  const [buttonTopPx, setButtonTopPx] = React.useState<number>(120);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const dragStartYRef = React.useRef<number>(0);
  const startTopPxRef = React.useRef<number>(120);
  const dragDeltaRef = React.useRef<number>(0);

  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging) return;
      const delta = e.clientY - dragStartYRef.current;
      dragDeltaRef.current = delta;
      const viewportHeight = window.innerHeight;
      const buttonHeight = 40; // approximate button height
      const margin = 12;
      const minTop = margin;
      const maxTop = viewportHeight - buttonHeight - margin;
      const next = Math.min(
        maxTop,
        Math.max(minTop, startTopPxRef.current + delta)
      );
      setButtonTopPx(next);
    }

    function handleMouseUp() {
      if (!isDragging) return;
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  function onStartDrag(e: React.MouseEvent<HTMLDivElement>) {
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    startTopPxRef.current = buttonTopPx;
    dragDeltaRef.current = 0;
  }

  function onMaybePreventClick(e: React.MouseEvent) {
    if (Math.abs(dragDeltaRef.current) > 3) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div
        className="fixed right-4 z-50 select-none"
        style={{ top: `${buttonTopPx}px` }}
        onMouseDown={onStartDrag}
      >
        <Link href="/upload" onClickCapture={onMaybePreventClick}>
          <Button className="shadow-lg">数据上传</Button>
        </Link>
      </div>

      <ChatInterface />
    </div>
  );
}
