import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Layers, Plus, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GenerateDeckDialog } from "@/components/flashcards/generate-deck-dialog";
import { DeckCard, type DeckCardData } from "@/components/flashcards/deck-card";

export const metadata = { title: "Flashcards" };

export default async function FlashcardsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { courseId } = await params;
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId },
    select: { id: true },
  });
  if (!course) notFound();

  const now = new Date();

  const [decks, documents] = await Promise.all([
    prisma.flashcardDeck.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { cards: true } },
        cards: {
          select: {
            id: true,
            progress: {
              where: { userId },
              select: { nextReview: true },
            },
          },
        },
      },
    }),
    prisma.document.findMany({
      where: { courseId, status: "READY" },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cards: DeckCardData[] = decks.map((d) => {
    const dueCount = d.cards.filter((c) => {
      const p = c.progress[0];
      return !p || p.nextReview <= now; // new cards or cards due now
    }).length;
    return {
      id: d.id,
      courseId,
      title: d.title,
      cardCount: d._count.cards,
      dueCount,
    };
  });

  const canGenerate = documents.length > 0;

  return (
    <div>
      <Header title="Flashcards">
        {canGenerate && (
          <GenerateDeckDialog
            courseId={courseId}
            documents={documents}
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Generate Deck
              </Button>
            }
          />
        )}
      </Header>

      <div className="p-6">
        {!canGenerate ? (
          <Card className="flex flex-col items-center py-16 text-center">
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 font-medium">No processed documents</p>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Upload and process at least one document before generating flashcards.
            </p>
            <Link href={`/courses/${courseId}/documents`} className={buttonVariants()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload documents
            </Link>
          </Card>
        ) : decks.length === 0 ? (
          <Card className="flex flex-col items-center py-16 text-center">
            <Layers className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 font-medium">No decks yet</p>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Generate your first flashcard deck from your course materials.
            </p>
            <GenerateDeckDialog
              courseId={courseId}
              documents={documents}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Deck
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
