import { prisma } from "@/lib/prisma";

/** Rough char budget (~4 chars/token → ~25k tokens of source material). */
export const DEFAULT_CONTEXT_BUDGET = 100_000;

/**
 * Loads the extracted text of the given READY documents, scoped to a course.
 * Throws if none of the documents are usable.
 */
export async function getDocumentsText(
  courseId: string,
  documentIds: string[]
): Promise<{ name: string; text: string }[]> {
  const docs = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      courseId,
      status: "READY",
      extractedText: { not: null },
    },
    select: { name: true, extractedText: true },
  });

  const usable = docs
    .filter((d): d is { name: string; extractedText: string } => Boolean(d.extractedText))
    .map((d) => ({ name: d.name, text: d.extractedText }));

  if (usable.length === 0) {
    throw new Error("No processed text found for the selected documents");
  }

  return usable;
}

/**
 * Combines document texts into a single context string under a char budget.
 * When the combined length exceeds the budget, each document is evenly
 * down-sampled so coverage stays balanced across all sources (rather than
 * truncating to only the first document).
 */
export function buildContext(
  docs: { name: string; text: string }[],
  budget = DEFAULT_CONTEXT_BUDGET
): string {
  const total = docs.reduce((sum, d) => sum + d.text.length, 0);

  if (total <= budget) {
    return docs.map((d) => `# ${d.name}\n\n${d.text}`).join("\n\n---\n\n");
  }

  const perDoc = Math.floor(budget / docs.length);
  return docs
    .map((d) => {
      if (d.text.length <= perDoc) return `# ${d.name}\n\n${d.text}`;
      // Sample evenly: take proportional slices spread across the document
      const slices = 6;
      const sliceLen = Math.floor(perDoc / slices);
      const step = Math.floor(d.text.length / slices);
      let sampled = "";
      for (let i = 0; i < slices; i++) {
        sampled += d.text.slice(i * step, i * step + sliceLen) + "\n…\n";
      }
      return `# ${d.name} (excerpts)\n\n${sampled}`;
    })
    .join("\n\n---\n\n");
}

/** Convenience: load + combine in one call. */
export async function buildCourseContext(
  courseId: string,
  documentIds: string[],
  budget = DEFAULT_CONTEXT_BUDGET
): Promise<string> {
  const docs = await getDocumentsText(courseId, documentIds);
  return buildContext(docs, budget);
}
