import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { DeckView, type DeckCard } from "@/components/flashcards/deck-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const deck = await prisma.flashcardDeck.findUnique({
    where: { id: deckId },
    select: { title: true },
  });
  return { title: deck?.title ?? "Deck" };
}

export default async function DeckPage({
  params,
}: {
  params: Promise<{ courseId: string; deckId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { courseId, deckId } = await params;
  const deck = await prisma.flashcardDeck.findFirst({
    where: { id: deckId, course: { userId } },
    include: {
      cards: {
        orderBy: { order: "asc" },
        include: { progress: { where: { userId }, select: { nextReview: true } } },
      },
    },
  });

  if (!deck) notFound();

  const now = new Date();
  const cards: DeckCard[] = deck.cards.map((c) => {
    const p = c.progress[0];
    return {
      id: c.id,
      front: c.front,
      back: c.back,
      tags: c.tags,
      due: !p || p.nextReview <= now,
    };
  });

  return (
    <div>
      <Header title={deck.title} />
      <div className="p-6">
        <Link
          href={`/courses/${courseId}/flashcards`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to decks
        </Link>

        {cards.length === 0 ? (
          <p className="text-center text-muted-foreground">This deck has no cards.</p>
        ) : (
          <DeckView courseId={courseId} title={deck.title} cards={cards} />
        )}
      </div>
    </div>
  );
}
