import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Brain, Plus, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateQuizDialog } from "@/components/quizzes/generate-quiz-dialog";
import { QuizCard, type QuizCardData } from "@/components/quizzes/quiz-card";

export const metadata = { title: "Quizzes" };

export default async function QuizzesPage({
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

  const [quizzes, documents] = await Promise.all([
    prisma.quiz.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { userId, completed: true },
          select: { score: true, totalPoints: true },
        },
      },
    }),
    prisma.document.findMany({
      where: { courseId, status: "READY" },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cards: QuizCardData[] = quizzes.map((q) => {
    const pcts = q.attempts
      .filter((a) => a.totalPoints && a.totalPoints > 0)
      .map((a) => Math.round(((a.score ?? 0) / (a.totalPoints || 1)) * 100));
    return {
      id: q.id,
      courseId,
      title: q.title,
      difficulty: q.difficulty,
      timeLimit: q.timeLimit,
      questionCount: q._count.questions,
      bestScorePct: pcts.length ? Math.max(...pcts) : null,
      attemptCount: q.attempts.length,
    };
  });

  const canGenerate = documents.length > 0;

  return (
    <div>
      <Header title="Quizzes">
        {canGenerate && (
          <GenerateQuizDialog
            courseId={courseId}
            documents={documents}
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Generate Quiz
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
              Upload and process at least one document before generating quizzes.
            </p>
            <Link href={`/courses/${courseId}/documents`} className={buttonVariants()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload documents
            </Link>
          </Card>
        ) : quizzes.length === 0 ? (
          <Card className="flex flex-col items-center py-16 text-center">
            <Brain className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 font-medium">No quizzes yet</p>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Generate your first AI quiz from your course materials.
            </p>
            <GenerateQuizDialog
              courseId={courseId}
              documents={documents}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Quiz
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
