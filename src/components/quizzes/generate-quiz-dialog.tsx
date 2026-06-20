"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DocumentMultiSelect,
  type SelectableDocument,
} from "@/components/shared/document-multi-select";
import { cn } from "@/lib/utils";
import type { Difficulty, QuestionType } from "@/types";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short answer" },
];

export function GenerateQuizDialog({
  courseId,
  documents,
  trigger,
}: {
  courseId: string;
  documents: SelectableDocument[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [questionCount, setQuestionCount] = useState(10);
  const [types, setTypes] = useState<QuestionType[]>(["MULTIPLE_CHOICE", "TRUE_FALSE"]);
  const [timed, setTimed] = useState(false);
  const [timeLimit, setTimeLimit] = useState(15);

  function toggleType(t: QuestionType) {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleGenerate() {
    if (selectedDocs.length === 0) return toast.error("Select at least one document");
    if (types.length === 0) return toast.error("Select at least one question type");

    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Quiz",
          documentIds: selectedDocs,
          difficulty,
          questionCount,
          questionTypes: types,
          timeLimit: timed ? timeLimit : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }
      const quiz = await res.json();
      toast.success("Quiz generated!");
      setOpen(false);
      router.push(`/courses/${courseId}/quizzes/${quiz.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate a quiz</DialogTitle>
          <DialogDescription>
            AI creates questions from your selected documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Title</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Review"
            />
          </div>

          <div className="space-y-2">
            <Label>Source documents</Label>
            <DocumentMultiSelect
              documents={documents}
              selected={selectedDocs}
              onChange={setSelectedDocs}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Questions</Label>
              <Select
                value={String(questionCount)}
                onValueChange={(v) => setQuestionCount(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} questions
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question types</Label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleType(value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    types.includes(value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="timed">Timed mode</Label>
              <button
                id="timed"
                type="button"
                role="switch"
                aria-checked={timed}
                onClick={() => setTimed((t) => !t)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  timed ? "bg-primary" : "bg-input"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform",
                    timed ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
            {timed && (
              <Select value={String(timeLimit)} onValueChange={(v) => setTimeLimit(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 30, 45, 60].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate quiz
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
