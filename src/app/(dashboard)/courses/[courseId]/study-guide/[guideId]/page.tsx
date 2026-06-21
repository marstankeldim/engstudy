import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/shared/markdown";
import { GUIDE_TYPES } from "@/components/study-guides/guide-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guideId: string }>;
}) {
  const { guideId } = await params;
  const guide = await prisma.studyGuide.findUnique({
    where: { id: guideId },
    select: { title: true },
  });
  return { title: guide?.title ?? "Study Guide" };
}

export default async function StudyGuidePage({
  params,
}: {
  params: Promise<{ courseId: string; guideId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { courseId, guideId } = await params;
  const guide = await prisma.studyGuide.findFirst({
    where: { id: guideId, course: { userId } },
  });

  if (!guide) notFound();

  const meta = GUIDE_TYPES[guide.type];

  return (
    <div>
      <Header title={guide.title} />
      <div className="mx-auto max-w-3xl p-6">
        <Link
          href={`/courses/${courseId}/study-guide`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to study guides
        </Link>

        <div className="mb-6">
          <Badge variant="secondary" className="mb-3">
            {meta.label}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{guide.title}</h1>
        </div>

        <Markdown content={guide.content} />
      </div>
    </div>
  );
}
