import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  BookOpen,
  Brain,
  FileText,
  FlaskConical,
  MessageSquare,
  Upload,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { name: true },
  });
  return { title: course?.name ?? "Course" };
}

const tools = [
  {
    key: "documents",
    label: "Documents",
    description: "Upload and manage your course materials",
    icon: FileText,
    href: (id: string) => `/courses/${id}/documents`,
  },
  {
    key: "quizzes",
    label: "Quizzes",
    description: "AI-generated quizzes from your materials",
    icon: Brain,
    href: (id: string) => `/courses/${id}/quizzes`,
  },
  {
    key: "flashcards",
    label: "Flashcards",
    description: "Spaced-repetition flashcard decks",
    icon: Zap,
    href: (id: string) => `/courses/${id}/flashcards`,
  },
  {
    key: "studyGuides",
    label: "Study Guides",
    description: "Summaries, formula sheets, and review sheets",
    icon: BookOpen,
    href: (id: string) => `/courses/${id}/study-guide`,
  },
  {
    key: "practiceExams",
    label: "Practice Exams",
    description: "Timed, scored exams to test yourself",
    icon: FlaskConical,
    href: (id: string) => `/courses/${id}/practice-exam`,
  },
  {
    key: "tutor",
    label: "AI Tutor",
    description: "Ask questions about your materials",
    icon: MessageSquare,
    href: (id: string) => `/courses/${id}/tutor`,
  },
] as const;

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { courseId } = await params;
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId },
    include: {
      _count: {
        select: {
          documents: true,
          quizzes: true,
          flashcardDecks: true,
          studyGuides: true,
          practiceExams: true,
        },
      },
    },
  });

  if (!course) notFound();

  const counts: Record<string, number> = {
    documents: course._count.documents,
    quizzes: course._count.quizzes,
    flashcards: course._count.flashcardDecks,
    studyGuides: course._count.studyGuides,
    practiceExams: course._count.practiceExams,
    tutor: 0,
  };

  const hasDocuments = course._count.documents > 0;

  return (
    <div>
      <Header title={course.name} />
      <div className="space-y-8 p-6">
        {/* Course header */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl text-3xl"
            style={{ backgroundColor: `${course.color}20` }}
          >
            {course.emoji}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{course.name}</h2>
            {course.description && (
              <p className="mt-1 text-muted-foreground">{course.description}</p>
            )}
          </div>
        </div>

        {/* Empty state nudge */}
        {!hasDocuments && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="mb-1 font-medium">Start by uploading your materials</p>
              <p className="mb-4 max-w-md text-sm text-muted-foreground">
                Upload lecture slides, textbook chapters, or notes. Then generate quizzes,
                flashcards, and study guides from them.
              </p>
              <Link href={`/courses/${course.id}/documents`} className={buttonVariants()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload documents
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Tools grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map(({ key, label, description, icon: Icon, href }) => {
            const count = counts[key];
            return (
              <Link key={key} href={href(course.id)}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {key !== "tutor" && count > 0 && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {count}
                        </span>
                      )}
                    </div>
                    <CardTitle className="mt-3 text-base">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
