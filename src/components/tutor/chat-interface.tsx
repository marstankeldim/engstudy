"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, Loader2, Sparkles, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/shared/markdown";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Summarize the key concepts in my materials",
  "Explain the most important formula with an example",
  "Quiz me on a topic from my notes",
  "What should I focus on for the exam?",
];

export function ChatInterface({
  courseId,
  hasDocuments,
  initialMessages,
}: {
  courseId: string;
  hasDocuments: boolean;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function scrollToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
        );
      }

      if (!acc.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, I couldn't generate a response. Please try again." }
              : m
          )
        );
      }
    } catch {
      toast.error("The tutor couldn't respond. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
      textareaRef.current?.focus();
    }
  }

  async function clearChat() {
    if (messages.length === 0) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/tutor`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMessages([]);
      toast.success("Conversation cleared");
    } catch {
      toast.error("Failed to clear conversation");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Ask your AI tutor</h2>
              <p className="mb-8 max-w-md text-sm text-muted-foreground">
                {hasDocuments
                  ? "I've read your course materials. Ask me to explain concepts, work through problems, or quiz you."
                  : "Upload and process documents to get answers grounded in your materials. You can still ask general questions now."}
              </p>
              <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m) => (
                <Message key={m.id} message={m} streaming={streaming} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t bg-background">
        <div className="mx-auto max-w-3xl px-4 py-3">
          {!isEmpty && (
            <div className="mb-2 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearChat} disabled={streaming}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          )}
          <div className="relative flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:border-primary/50">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your course…"
              rows={1}
              className="max-h-40 min-h-0 resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0"
            />
            <Button
              size="icon"
              onClick={() => send(input)}
              disabled={streaming || !input.trim()}
              className="shrink-0 rounded-xl"
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            Press Enter to send · Shift+Enter for a new line
          </p>
        </div>
      </div>
    </div>
  );
}

function Message({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  const isUser = message.role === "user";
  const isEmpty = message.content.length === 0;

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-secondary" : "bg-primary/10"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-secondary-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-primary" />
        )}
      </div>
      <div
        className={cn(
          "min-w-0 max-w-[85%] rounded-2xl px-4 py-2.5",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : isEmpty && streaming ? (
          <div className="flex items-center gap-1 py-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
          </div>
        ) : (
          <Markdown content={message.content} className="prose-p:my-2 prose-headings:my-3" />
        )}
      </div>
    </div>
  );
}
