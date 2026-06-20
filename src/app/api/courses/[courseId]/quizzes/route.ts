import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { generateQuizSchema } from "@/lib/validations";
import { generateQuizQuestions } from "@/lib/quiz";
import type { Prisma } from "@/generated/prisma/client";

type Params = { params: Promise<{ courseId: string }> };

// Quiz generation calls the LLM and can take a while.
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

    const body = await req.json();
    const input = generateQuizSchema.parse(body);

    const questions = await generateQuizQuestions({
      courseId,
      documentIds: input.documentIds,
      difficulty: input.difficulty,
      questionCount: input.questionCount,
      questionTypes: input.questionTypes,
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "The model returned no usable questions. Try again." },
        { status: 502 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        title: input.title,
        difficulty: input.difficulty,
        timeLimit: input.timeLimit || null,
        questions: {
          create: questions.map((q, i) => ({
            type: q.type,
            content: q.content,
            options: (q.options ?? undefined) as Prisma.InputJsonValue | undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: 1,
            order: i,
          })),
        },
      },
      include: { _count: { select: { questions: true } } },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
    }
    console.error("[QUIZ_GENERATE]", error);
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
