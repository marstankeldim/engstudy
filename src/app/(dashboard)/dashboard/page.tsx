import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Brain, GraduationCap, Plus, TrendingUp, Zap } from "lucide-react";
import type { Course } from "@/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [courses, quizAttempts] = await Promise.all([
    prisma.course.findMany({
      where: { userId },
      include: { _count: { select: { documents: true, quizzes: true, flashcardDecks: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.quizAttempt.findMany({
      where: { userId, completed: true },
      select: { score: true, totalPoints: true },
    }),
  ]);

  const avgScore =
    quizAttempts.length > 0
      ? Math.round(
          (quizAttempts.reduce(
            (acc: number, a: { score: number | null; totalPoints: number | null }) =>
              acc + (a.score ?? 0) / (a.totalPoints || 1),
            0
          ) /
            quizAttempts.length) *
            100
        )
      : null;

  const totalDecks = courses.reduce(
    (s: number, c: Course & { _count: { flashcardDecks: number } }) =>
      s + c._count.flashcardDecks,
    0
  );

  const stats = [
    { label: "Courses", value: courses.length, icon: GraduationCap },
    { label: "Quizzes Taken", value: quizAttempts.length, icon: Brain },
    { label: "Avg Score", value: avgScore !== null ? `${avgScore}%` : "—", icon: TrendingUp },
    { label: "Active Decks", value: totalDecks, icon: Zap },
  ];

  return (
    <div>
      <Header title="Dashboard">
        <Link href="/courses/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Link>
      </Header>

      <div className="p-6 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Courses */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Courses</h2>
            <Link href="/courses" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all
            </Link>
          </div>
          {courses.length === 0 ? (
            <Card className="flex flex-col items-center py-16 text-center">
              <BookOpen className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 font-medium">No courses yet</p>
              <p className="mb-6 text-sm text-muted-foreground">
                Create your first course and upload your materials to get started.
              </p>
              <Link href="/courses/new" className={buttonVariants()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                          style={{ backgroundColor: `${course.color}20` }}
                        >
                          {course.emoji}
                        </div>
                        <div>
                          <CardTitle className="text-base">{course.name}</CardTitle>
                          {course.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{course._count.documents} docs</span>
                        <span>{course._count.quizzes} quizzes</span>
                        <span>{course._count.flashcardDecks} decks</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
