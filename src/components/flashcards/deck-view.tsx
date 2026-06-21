"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FlashcardStudy, type StudyCard } from "@/components/flashcards/flashcard-study";

export interface DeckCard extends StudyCard {
  due: boolean;
}

interface DeckViewProps {
  courseId: string;
  title: string;
  cards: DeckCard[];
}

export function DeckView({ courseId, title, cards }: DeckViewProps) {
  const router = useRouter();
  const [studying, setStudying] = useState<StudyCard[] | null>(null);

  const dueCards = cards.filter((c) => c.due);

  function startStudy(deckCards: DeckCard[]) {
    setStudying(deckCards.map(({ id, front, back, tags }) => ({ id, front, back, tags })));
  }

  function exitStudy() {
    setStudying(null);
    router.refresh(); // refresh due counts
  }

  if (studying) {
    return <FlashcardStudy courseId={courseId} cards={studying} onExit={exitStudy} />;
  }

  return (
    <div className="space-y-6">
      {/* Study launcher */}
      <div className="flex flex-col items-start gap-3 rounded-xl border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">
            {cards.length} cards ·{" "}
            {dueCards.length > 0 ? (
              <span className="text-primary">{dueCards.length} due for review</span>
            ) : (
              "all caught up"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {dueCards.length > 0 ? (
            <Button onClick={() => startStudy(dueCards)}>
              <Play className="mr-2 h-4 w-4" />
              Study {dueCards.length} due
            </Button>
          ) : (
            <Button variant="outline" onClick={() => startStudy(cards)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Review all again
            </Button>
          )}
        </div>
      </div>

      {/* Browse grid */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          All cards ({cards.length})
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <BrowseCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BrowseCard({ card }: { card: DeckCard }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className={cn(
        "flex min-h-32 flex-col rounded-xl border p-4 text-left transition-colors hover:border-primary/40",
        flipped && "bg-muted/40"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {flipped ? "Back" : "Front"}
        </span>
        {card.due && !flipped && (
          <Badge className="bg-primary/10 px-1.5 py-0 text-[10px] text-primary">due</Badge>
        )}
      </div>
      <p className="flex-1 whitespace-pre-wrap text-sm">{flipped ? card.back : card.front}</p>
      {!flipped && card.tags.length > 0 && (
        <p className="mt-2 truncate text-xs text-muted-foreground">{card.tags.join(" · ")}</p>
      )}
    </button>
  );
}
