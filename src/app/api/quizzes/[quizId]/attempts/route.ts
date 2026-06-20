import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { gradeShortAnswer } from "@/lib/quiz";

type Params = { params: Promise<{ quizId: string }> };

// AI grading of short answers can add latency.
export const maxDuration = 120;

const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
    })
  ),
  durationSeconds: z.number().int().min(0).optional(),
});

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { quizId } = await params;
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, course: { userId } },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { answers, durationSeconds } = submitSchema.parse(await req.json());
    const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

    // Grade each question
    const graded = await Promise.all(
      quiz.questions.map(async (q) => {
        const userAnswer = answerMap.get(q.id) ?? "";
        let isCorrect = false;
        let feedback: string | undefined;

        if (q.type === "SHORT_ANSWER") {
          const result = await gradeShortAnswer(q.content, q.correctAnswer, userAnswer);
          isCorrect = result.isCorrect;
          feedback = result.feedback;
        } else {
          // MCQ / TRUE_FALSE: case-insensitive exact match
          isCorrect =
            userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        }

        return {
          questionId: q.id,
          userAnswer,
          isCorrect,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          feedback,
          points: q.points,
        };
      })
    );

    const score = graded.reduce((s, g) => s + (g.isCorrect ? g.points : 0), 0);
    const totalPoints = quiz.questions.reduce((s, q) => s + q.points, 0);

    // Persist attempt + answers, and log a study session, in one transaction
    const attempt = await prisma.$transaction(async (tx) => {
      const created = await tx.quizAttempt.create({
        data: {
          quizId,
          userId,
          score,
          totalPoints,
          completed: true,
          completedAt: new Date(),
          answers: {
            create: graded.map((g) => ({
              questionId: g.questionId,
              userAnswer: g.userAnswer,
              isCorrect: g.isCorrect,
            })),
          },
        },
      });

      await tx.studySession.create({
        data: {
          userId,
          courseId: quiz.courseId,
          type: "QUIZ",
          duration: durationSeconds ?? null,
          endedAt: new Date(),
        },
      });

      return created;
    });

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      totalPoints,
      results: graded,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
    }
    console.error("[QUIZ_ATTEMPT]", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
