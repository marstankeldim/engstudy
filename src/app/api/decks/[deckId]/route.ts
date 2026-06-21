import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

type Params = { params: Promise<{ deckId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { deckId } = await params;
    const deck = await prisma.flashcardDeck.findFirst({
      where: { id: deckId, course: { userId } },
      select: { id: true },
    });
    if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.flashcardDeck.delete({ where: { id: deckId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DECK_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
