import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { BookOpen, Plus, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GenerateGuideDialog } from "@/components/study-guides/generate-guide-dialog";
import { GuideCard, type GuideCardData } from "@/components/study-guides/guide-card";

export const metadata = { title: "Study Guides" };

export default async function StudyGuidesPage({
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

  const [guides, documents] = await Promise.all([
    prisma.studyGuide.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, type: true, createdAt: true },
    }),
    prisma.document.findMany({
      where: { courseId, status: "READY" },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cards: GuideCardData[] = guides.map((g) => ({
    id: g.id,
    courseId,
    title: g.title,
    type: g.type,
    createdAt: g.createdAt,
  }));

  const canGenerate = documents.length > 0;

  return (
    <div>
      <Header title="Study Guides">
        {canGenerate && (
          <GenerateGuideDialog
            courseId={courseId}
            documents={documents}
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Generate Guide
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
              Upload and process at least one document before generating study guides.
            </p>
            <Link href={`/courses/${courseId}/documents`} className={buttonVariants()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload documents
            </Link>
          </Card>
        ) : guides.length === 0 ? (
          <Card className="flex flex-col items-center py-16 text-center">
            <BookOpen className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 font-medium">No study guides yet</p>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Generate a summary, formula sheet, exam review, or key takeaways.
            </p>
            <GenerateGuideDialog
              courseId={courseId}
              documents={documents}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Guide
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
