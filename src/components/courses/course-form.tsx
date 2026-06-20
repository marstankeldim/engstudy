"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

const EMOJI_OPTIONS = [
  "📚", "📐", "⚙️", "🔬", "💻", "🧮", "⚡", "🧪",
  "🛠️", "📡", "🔢", "🏗️", "🧬", "🔌", "📊", "🚀",
];

const COLOR_OPTIONS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
  "#10b981", "#06b6d4", "#3b82f6", "#64748b", "#14b8a6",
];

interface CourseFormProps {
  course?: Pick<Course, "id" | "name" | "description" | "color" | "emoji">;
  onSuccess?: () => void;
}

export function CourseForm({ course, onSuccess }: CourseFormProps) {
  const router = useRouter();
  const isEdit = Boolean(course);

  const [name, setName] = useState(course?.name ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [emoji, setEmoji] = useState(course?.emoji ?? "📚");
  const [color, setColor] = useState(course?.color ?? "#6366f1");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a course name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/courses/${course!.id}` : "/api/courses",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, emoji, color }),
        }
      );

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      toast.success(isEdit ? "Course updated" : "Course created");
      onSuccess?.();
      router.refresh();
      if (!isEdit) router.push(`/courses/${data.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Preview */}
      <div className="flex items-center gap-3 rounded-lg border p-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
          style={{ backgroundColor: `${color}20` }}
        >
          {emoji}
        </div>
        <div>
          <p className="font-medium">{name || "Course name"}</p>
          <p className="text-sm text-muted-foreground">
            {description || "Course description"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Course name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Thermodynamics I"
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this course about?"
          maxLength={500}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-colors",
                emoji === e ? "border-primary bg-primary/10" : "hover:bg-muted"
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                color === c ? "border-foreground" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create course"}
        </Button>
      </div>
    </form>
  );
}
