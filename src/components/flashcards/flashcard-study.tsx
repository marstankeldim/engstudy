"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SM2Quality } from "@/lib/sm2";

export interface StudyCard {
  id: string;
  front: string;
  back: string;
  tags: string[];
}

const RATINGS: { label: string; quality: SM2Quality; className: string; hint: string }[] = [
  { label: "Again", quality: 1, className: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400", hint: "< 1 day" },
  { label: "Hard", quality: 3, className: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400", hint: "Soon" },
  { label: "Good", quality: 4, className: "bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 dark:text-sky-400", hint: "Normal" },
  { label: "Easy", quality: 5, className: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400", hint: "Later" },
];

interface FlashcardStudyProps {
  courseId: string;
  cards: StudyCard[];
  onExit: () => void;
}

export function FlashcardStudy({ courseId, cards, onExit }: FlashcardStudyProps) {
  const [queue, setQueue] = useState<StudyCard[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [again, setAgain] = useState(0);
  const [finished, setFinished] = useState(false);
  const startRef = useRef(Date.now());
  const total = cards.length;

  const current = queue[0];

  async function rate(quality: SM2Quality) {
    if (!current) return;
    const card = current;

    // Optimistically advance the UI
    setReviewed((n) => n + 1);
    setFlipped(false);
    setQueue((prev) => {
      const [, ...rest] = prev;
      // Re-queue "Again" cards to the end of this session
      return quality <= 2 ? [...rest, card] : rest;
    });
    if (quality <= 2) setAgain((n) => n + 1);

    // Persist SM-2 progress (fire and forget; failure is non-blocking)
    try {
      await fetch(`/api/flashcards/${card.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
    } catch {
      /* ignore — review will simply not persist */
    }
  }

  // Detect end of session
  useEffect(() => {
    if (!finished && queue.length === 0 && reviewed > 0) {
      setFinished(true);
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      void fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, type: "FLASHCARDS", duration }),
      }).catch(() => {});
    }
  }, [queue.length, reviewed, finished, courseId]);

  // Keyboard: space/enter flips; 1–4 rate when flipped
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finished || !current) return;
      if (!flipped && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        rate(RATINGS[Number(e.key) - 1].quality);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, finished, current]);

  if (finished) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
        <h2 className="mb-2 text-2xl font-bold">Session complete!</h2>
        <p className="mb-6 text-muted-foreground">
          You reviewed {reviewed} card{reviewed === 1 ? "" : "s"}
          {again > 0 ? ` · ${again} marked for repeat` : ""}.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onExit}>
            Back to deck
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const progressPct = total > 0 ? (Math.min(reviewed, total) / total) * 100 : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {Math.min(reviewed + 1, total)} / {total}
        </span>
        <button onClick={onExit} className="hover:text-foreground">
          Exit
        </button>
      </div>
      <Progress value={progressPct} />

      {/* Card */}
      <button
        type="button"
        onClick={() => !flipped && setFlipped(true)}
        className={cn(
          "flex min-h-72 w-full flex-col items-center justify-center rounded-2xl border-2 p-8 text-center transition-colors",
          flipped ? "cursor-default border-primary/30 bg-card" : "cursor-pointer hover:border-primary/40"
        )}
      >
        {flipped ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Answer
            </p>
            <p className="whitespace-pre-wrap text-lg leading-relaxed">{current.back}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {current.tags.length > 0 ? current.tags.join(" · ") : "Tap to flip"}
            </p>
            <p className="text-xl font-medium leading-relaxed">{current.front}</p>
          </div>
        )}
      </button>

      {/* Controls */}
      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.label}
              onClick={() => rate(r.quality)}
              className={cn("rounded-lg py-3 text-center transition-colors", r.className)}
            >
              <span className="block text-sm font-semibold">{r.label}</span>
              <span className="block text-xs opacity-70">{r.hint}</span>
            </button>
          ))}
        </div>
      ) : (
        <Button className="w-full" onClick={() => setFlipped(true)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Show answer
        </Button>
      )}

      {flipped && (
        <p className="text-center text-xs text-muted-foreground">
          Press <Badge variant="secondary" className="mx-0.5">1</Badge>–
          <Badge variant="secondary" className="mx-0.5">4</Badge> to rate
        </p>
      )}
    </div>
  );
}
