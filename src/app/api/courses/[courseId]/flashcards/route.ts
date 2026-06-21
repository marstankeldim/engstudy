import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { generateFlashcardsSchema } from "@/lib/validations";
import { generateFlashcards } from "@/lib/flashcards";

type Params = { params: Promise<{ courseId: string }> };

export const maxDuration = 120;

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
      select: { id: true },
    });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const input = generateFlashcardsSchema.parse(await req.json());

    const cards = await generateFlashcards({
      courseId,
      documentIds: input.documentIds,
      cardCount: input.cardCount,
    });

    if (cards.length === 0) {
      return NextResponse.json(
        { error: "The model returned no cards. Try again." },
        { status: 502 }
      );
    }

    const deck = await prisma.flashcardDeck.create({
      data: {
        courseId,
        title: input.title,
        cards: {
          create: cards.map((c, i) => ({
            front: c.front,
            back: c.back,
            tags: c.tags,
            order: i,
          })),
        },
      },
      include: { _count: { select: { cards: true } } },
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
    }
    console.error("[FLASHCARDS_GENERATE]", error);
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }
}
