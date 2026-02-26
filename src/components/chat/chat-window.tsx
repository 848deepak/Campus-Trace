"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export function ChatWindow({ matchId, currentUserId }: { matchId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");

  const load = async () => {
    const response = await fetch(`/api/messages/${matchId}`);
    const data = await response.json();
    if (response.ok) {
      setMessages(data.messages);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const send = async () => {
    if (!content.trim()) return;
    await fetch(`/api/messages/${matchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setContent("");
    load();
  };

  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-semibold">Private Match Chat</h2>
      <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              message.senderId === currentUserId
                ? "ml-auto bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Type message" />
        <Button onClick={send}>Send</Button>
      </div>
    </Card>
  );
}
