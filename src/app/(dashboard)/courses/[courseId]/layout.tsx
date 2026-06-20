import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { CourseSidebar } from "@/components/layout/sidebar";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { courseId } = await params;
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId },
    select: { id: true, name: true, emoji: true },
  });

  if (!course) notFound();

  return (
    <div className="flex h-full">
      <CourseSidebar courseId={course.id} courseName={course.name} emoji={course.emoji} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
