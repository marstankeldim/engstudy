"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { QuestionCard, type PlayerQuestion } from "@/components/quizzes/question-card";
import { ResultsScreen, type GradedResult } from "@/components/quizzes/results-screen";

interface QuizPlayerProps {
  quizId: string;
  courseId: string;
  title: string;
  timeLimit: number | null; // minutes
  questions: PlayerQuestion[];
}

interface SubmitResponse {
  score: number;
  totalPoints: number;
  results: GradedResult[];
}

export function QuizPlayer({
  quizId,
  courseId,
  title,
  timeLimit,
  questions,
}: QuizPlayerProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [remaining, setRemaining] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null
  );
  const startRef = useRef(Date.now());

  const question = questions[current];
  const answeredCount = Object.values(answers).filter((v) => v.trim()).length;
  const isLast = current === questions.length - 1;

  const handleSubmit = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: questions.map((q) => ({
            questionId: q.id,
            answer: answers[q.id] ?? "",
          })),
          durationSeconds,
        }),
      });
      if (!res.ok) throw new Error();
      const data: SubmitResponse = await res.json();
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, result, quizId, questions, answers]);

  // Countdown timer
  useEffect(() => {
    if (remaining === null || result) return;
    if (remaining <= 0) {
      toast.info("Time's up — submitting your quiz.");
      void handleSubmit();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(id);
  }, [remaining, result, handleSubmit]);

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function handleRetake() {
    setAnswers({});
    setCurrent(0);
    setResult(null);
    setRemaining(timeLimit ? timeLimit * 60 : null);
    startRef.current = Date.now();
  }

  if (result) {
    return (
      <ResultsScreen
        score={result.score}
        totalPoints={result.totalPoints}
        results={result.results}
        questions={questions}
        courseId={courseId}
        onRetake={handleRetake}
      />
    );
  }

  const mins = remaining !== null ? Math.floor(remaining / 60) : 0;
  const secs = remaining !== null ? remaining % 60 : 0;
  const lowTime = remaining !== null && remaining <= 30;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Question {current + 1} of {questions.length} · {answeredCount} answered
          </p>
        </div>
        {remaining !== null && (
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums",
              lowTime ? "bg-rose-500/10 text-rose-500" : "bg-muted"
            )}
          >
            <Clock className="h-4 w-4" />
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
        )}
      </div>

      <Progress value={((current + 1) / questions.length) * 100} />

      {/* Question */}
      <Card>
        <CardContent className="py-6">
          <QuestionCard
            question={question}
            value={answers[question.id] ?? ""}
            onChange={setAnswer}
          />
        </CardContent>
      </Card>

      {/* Question dots */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrent(i)}
            aria-label={`Go to question ${i + 1}`}
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-colors",
              i === current
                ? "bg-primary"
                : answers[q.id]?.trim()
                  ? "bg-primary/40"
                  : "bg-muted-foreground/25"
            )}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        {isLast ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Grading…
              </>
            ) : (
              "Submit quiz"
            )}
          </Button>
        ) : (
          <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
