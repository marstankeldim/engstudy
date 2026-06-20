import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { GraduationCap, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/courses/course-card";
import type { CourseWithCounts } from "@/types";

export const metadata = { title: "My Courses" };

export default async function CoursesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const courses = (await prisma.course.findMany({
    where: { userId },
    include: {
      _count: {
        select: { documents: true, quizzes: true, flashcardDecks: true, studyGuides: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })) as CourseWithCounts[];

  return (
    <div>
      <Header title="My Courses">
        <Link href="/courses/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Link>
      </Header>

      <div className="p-6">
        {courses.length === 0 ? (
          <Card className="flex flex-col items-center py-20 text-center">
            <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No courses yet</p>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Create your first course, then upload lecture slides, textbooks, or notes to
              start generating quizzes and flashcards.
            </p>
            <Link href="/courses/new" className={buttonVariants()}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first course
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
