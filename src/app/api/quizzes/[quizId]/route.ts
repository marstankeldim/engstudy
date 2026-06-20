import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

type Params = { params: Promise<{ quizId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { quizId } = await params;
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, course: { userId } },
      select: { id: true },
    });
    if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.quiz.delete({ where: { id: quizId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[QUIZ_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
