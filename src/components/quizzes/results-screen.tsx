"use client";

import Link from "next/link";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlayerQuestion } from "@/components/quizzes/question-card";

export interface GradedResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  feedback?: string;
}

interface ResultsScreenProps {
  score: number;
  totalPoints: number;
  results: GradedResult[];
  questions: PlayerQuestion[];
  courseId: string;
  onRetake: () => void;
}

function labelForAnswer(q: PlayerQuestion | undefined, answer: string): string {
  if (!q) return answer || "—";
  if (q.type === "MULTIPLE_CHOICE" && q.options) {
    const opt = q.options.find((o) => o.id === answer);
    return opt ? `${opt.id}. ${opt.text}` : answer || "—";
  }
  if (q.type === "TRUE_FALSE") return answer ? answer.charAt(0).toUpperCase() + answer.slice(1) : "—";
  return answer || "—";
}

export function ResultsScreen({
  score,
  totalPoints,
  results,
  questions,
  courseId,
  onRetake,
}: ResultsScreenProps) {
  const pct = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const verdict =
    pct >= 80 ? "Excellent work!" : pct >= 60 ? "Good effort — keep going." : "Keep studying — you'll get there.";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Score summary */}
      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div
            className={cn(
              "mb-3 text-5xl font-extrabold",
              pct >= 80 ? "text-emerald-500" : pct >= 60 ? "text-amber-500" : "text-rose-500"
            )}
          >
            {pct}%
          </div>
          <p className="text-lg font-medium">{verdict}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {score} of {totalPoints} points
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={onRetake}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Link href={`/courses/${courseId}/quizzes`} className={buttonVariants()}>
              Back to quizzes
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Review */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Review</h3>
        {results.map((r, i) => {
          const q = questionMap.get(r.questionId);
          return (
            <Card key={r.questionId}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start gap-3">
                  {r.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      <span className="text-muted-foreground">Q{i + 1}.</span> {q?.content}
                    </p>

                    <div className="mt-2 space-y-1 text-sm">
                      <p className={cn(r.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        Your answer: {labelForAnswer(q, r.userAnswer)}
                      </p>
                      {!r.isCorrect && q?.type !== "SHORT_ANSWER" && (
                        <p className="text-emerald-600 dark:text-emerald-400">
                          Correct: {labelForAnswer(q, r.correctAnswer)}
                        </p>
                      )}
                      {q?.type === "SHORT_ANSWER" && (
                        <p className="text-muted-foreground">
                          Model answer: {r.correctAnswer}
                        </p>
                      )}
                    </div>

                    {r.feedback && (
                      <p className="mt-2 text-sm italic text-muted-foreground">{r.feedback}</p>
                    )}
                    <p className="mt-2 rounded-md bg-muted/60 p-2.5 text-sm text-muted-foreground">
                      {r.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
