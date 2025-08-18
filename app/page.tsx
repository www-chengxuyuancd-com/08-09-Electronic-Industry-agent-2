"use client";

import { ChatInterface } from "@/components/home/chat-interface";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-end">
        <Link href="/upload">
          <Button>数据上传</Button>
        </Link>
      </div>
      <ChatInterface />
    </div>
  );
}
