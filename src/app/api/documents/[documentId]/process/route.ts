import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { processDocument } from "@/lib/documents";

type Params = { params: Promise<{ documentId: string }> };

// Re-extraction + embedding can be slow for large PDFs.
export const maxDuration = 300;

/**
 * Retry processing for a document (e.g. after a FAILED state).
 */
export async function POST(_req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId } = await params;
    const doc = await prisma.document.findFirst({
      where: { id: documentId, course: { userId } },
      select: { id: true },
    });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await processDocument(documentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DOCUMENT_PROCESS]", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
