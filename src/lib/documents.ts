import { prisma } from "@/lib/prisma";
import { fetchAndExtractPdf } from "@/lib/pdf";
import { embedDocument } from "@/lib/embeddings";

/**
 * Full processing pipeline for an uploaded document:
 *   PROCESSING → fetch PDF → extract text → chunk + embed → READY | FAILED
 *
 * Designed to be idempotent: re-running on a document re-extracts and
 * re-embeds, replacing prior chunks. Failures flip the status to FAILED
 * so the user can retry.
 */
export async function processDocument(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error(`Document ${documentId} not found`);

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "PROCESSING" },
  });

  try {
    const { text, pageCount } = await fetchAndExtractPdf(doc.fileUrl);
    // Normalize whitespace (incl. non-breaking spaces) and collapse runs
    const cleaned = text.replace(/\s+/g, " ").trim();

    if (!cleaned) {
      throw new Error("No extractable text found (the PDF may be scanned images)");
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { extractedText: cleaned, pageCount },
    });

    await embedDocument(documentId, cleaned);

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY" },
    });
  } catch (error) {
    console.error(`[processDocument] ${documentId} failed:`, error);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}
