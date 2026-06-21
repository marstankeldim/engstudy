import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ChatInterface } from "@/components/tutor/chat-interface";

export const metadata = { title: "AI Tutor" };

export default async function TutorPage({
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

  const [history, readyDocCount] = await Promise.all([
    prisma.tutorMessage.findMany({
      where: { userId, courseId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true },
    }),
    prisma.document.count({ where: { courseId, status: "READY" } }),
  ]);

  const initialMessages = history.map((m) => ({
    id: m.id,
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  return (
    <div className="flex h-full flex-col">
      <Header title="AI Tutor" />
      <ChatInterface
        courseId={courseId}
        hasDocuments={readyDocCount > 0}
        initialMessages={initialMessages}
      />
    </div>
  );
}
