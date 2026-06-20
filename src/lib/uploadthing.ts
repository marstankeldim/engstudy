import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/documents";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 10 },
  })
    .input(z.object({ courseId: z.string() }))
    .middleware(async ({ input }) => {
      const { userId } = await auth();
      if (!userId) throw new UploadThingError("Unauthorized");

      // Ensure the course belongs to the requesting user
      const course = await prisma.course.findFirst({
        where: { id: input.courseId, userId },
        select: { id: true },
      });
      if (!course) throw new UploadThingError("Course not found");

      return { userId, courseId: course.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Create the document record immediately so the UI can show it
      const document = await prisma.document.create({
        data: {
          courseId: metadata.courseId,
          name: file.name,
          fileUrl: file.ufsUrl,
          fileKey: file.key,
          fileSize: file.size,
          mimeType: file.type || "application/pdf",
          status: "PROCESSING",
        },
      });

      // Process inline. processDocument flips status to READY/FAILED itself,
      // so we swallow errors here to keep the upload itself successful.
      try {
        await processDocument(document.id);
      } catch (error) {
        console.error("[onUploadComplete] processing failed:", error);
      }

      return { documentId: document.id, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
