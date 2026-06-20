import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { UploadZone } from "@/components/documents/upload-zone";
import { DocumentCard } from "@/components/documents/document-card";
import { ProcessingPoller } from "@/components/documents/processing-poller";
import type { Document } from "@/types";

export const metadata = { title: "Documents" };

export default async function DocumentsPage({
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

  const documents = (await prisma.document.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
  })) as Document[];

  const hasProcessing = documents.some((d) => d.status === "PROCESSING");
  const readyCount = documents.filter((d) => d.status === "READY").length;

  return (
    <div>
      <Header title="Documents" />
      <ProcessingPoller active={hasProcessing} />

      <div className="space-y-6 p-6">
        <UploadZone courseId={courseId} />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {documents.length === 0
                ? "No documents yet"
                : `${documents.length} document${documents.length === 1 ? "" : "s"} · ${readyCount} ready`}
            </h2>
          </div>

          {documents.length > 0 && (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
