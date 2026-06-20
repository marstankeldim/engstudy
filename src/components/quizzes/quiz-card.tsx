"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Brain, Clock, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  HARD: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export interface QuizCardData {
  id: string;
  courseId: string;
  title: string;
  difficulty: Difficulty;
  timeLimit: number | null;
  questionCount: number;
  bestScorePct: number | null;
  attemptCount: number;
}

export function QuizCard({ quiz }: { quiz: QuizCardData }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Quiz deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete quiz");
      setDeleting(false);
    }
  }

  return (
    <Card className="group relative h-full transition-shadow hover:shadow-md">
      <div className="absolute right-3 top-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={deleting}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "opacity-0 transition-opacity group-hover:opacity-100"
            )}
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href={`/courses/${quiz.courseId}/quizzes/${quiz.id}`}>
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="pr-8 text-base">{quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={DIFFICULTY_STYLES[quiz.difficulty]}>
              {quiz.difficulty.toLowerCase()}
            </Badge>
            <Badge variant="secondary">{quiz.questionCount} questions</Badge>
            {quiz.timeLimit != null && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {quiz.timeLimit}m
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {quiz.attemptCount === 0 ? (
              "Not attempted yet"
            ) : (
              <>
                Best: <span className="font-medium text-foreground">{quiz.bestScorePct}%</span>{" "}
                · {quiz.attemptCount} attempt{quiz.attemptCount === 1 ? "" : "s"}
              </>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
