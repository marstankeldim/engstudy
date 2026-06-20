import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

type Params = { params: Promise<{ documentId: string }> };

const utapi = new UTApi();

/**
 * Loads a document only if it belongs to a course owned by the user.
 */
async function getOwnedDocument(documentId: string, userId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, course: { userId } },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId } = await params;
    const doc = await getOwnedDocument(documentId, userId);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Best-effort delete of the stored file; proceed even if it fails
    try {
      await utapi.deleteFiles(doc.fileKey);
    } catch (error) {
      console.error("[DOCUMENT_DELETE] file cleanup failed:", error);
    }

    await prisma.document.delete({ where: { id: documentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DOCUMENT_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
