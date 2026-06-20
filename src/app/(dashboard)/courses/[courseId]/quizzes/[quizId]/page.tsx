import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { QuizPlayer } from "@/components/quizzes/quiz-player";
import type { PlayerQuestion } from "@/components/quizzes/question-card";
import type { MCQOption } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { title: true } });
  return { title: quiz?.title ?? "Quiz" };
}

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { courseId, quizId } = await params;
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, course: { userId } },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!quiz) notFound();

  // Sanitize: never send correctAnswer/explanation to the client
  const questions: PlayerQuestion[] = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    content: q.content,
    options: (q.options as unknown as MCQOption[] | null) ?? null,
    points: q.points,
  }));

  return (
    <div>
      <Header title={quiz.title} />
      <div className="p-6">
        <Link
          href={`/courses/${courseId}/quizzes`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to quizzes
        </Link>

        {questions.length === 0 ? (
          <p className="text-center text-muted-foreground">This quiz has no questions.</p>
        ) : (
          <QuizPlayer
            quizId={quiz.id}
            courseId={courseId}
            title={quiz.title}
            timeLimit={quiz.timeLimit}
            questions={questions}
          />
        )}
      </div>
    </div>
  );
}
