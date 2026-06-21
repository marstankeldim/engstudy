import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { sm2, type SM2Quality } from "@/lib/sm2";

type Params = { params: Promise<{ cardId: string }> };

const reviewSchema = z.object({
  quality: z.number().int().min(0).max(5),
});

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cardId } = await params;

    // Verify the card belongs to a deck in a course owned by the user
    const card = await prisma.flashcard.findFirst({
      where: { id: cardId, deck: { course: { userId } } },
      select: { id: true },
    });
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { quality } = reviewSchema.parse(await req.json());

    const existing = await prisma.flashcardProgress.findUnique({
      where: { userId_flashcardId: { userId, flashcardId: cardId } },
    });

    const prevState = existing
      ? {
          easeFactor: existing.easeFactor,
          interval: existing.interval,
          repetitions: existing.repetitions,
        }
      : { easeFactor: 2.5, interval: 1, repetitions: 0 };

    const next = sm2(prevState, quality as SM2Quality);

    const progress = await prisma.flashcardProgress.upsert({
      where: { userId_flashcardId: { userId, flashcardId: cardId } },
      create: {
        userId,
        flashcardId: cardId,
        easeFactor: next.easeFactor,
        interval: next.interval,
        repetitions: next.repetitions,
        nextReview: next.nextReview,
        lastReview: new Date(),
      },
      update: {
        easeFactor: next.easeFactor,
        interval: next.interval,
        repetitions: next.repetitions,
        nextReview: next.nextReview,
        lastReview: new Date(),
      },
    });

    return NextResponse.json({
      easeFactor: progress.easeFactor,
      interval: progress.interval,
      repetitions: progress.repetitions,
      nextReview: progress.nextReview,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
    }
    console.error("[FLASHCARD_REVIEW]", error);
    return NextResponse.json({ error: "Failed to record review" }, { status: 500 });
  }
}
