import { prisma } from "@/lib/prisma";
import { createEmbedding } from "@/lib/openai";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

export function chunkText(text: string): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    if (chunk.trim()) chunks.push(chunk.trim());
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

export async function embedDocument(documentId: string, text: string) {
  const chunks = chunkText(text);

  await prisma.documentChunk.deleteMany({ where: { documentId } });

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await createEmbedding(chunks[i]);
    const vectorLiteral = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (id, "documentId", content, "chunkIndex", embedding, "tokenCount")
      VALUES (gen_random_uuid()::text, ${documentId}, ${chunks[i]}, ${i}, ${vectorLiteral}::vector, ${chunks[i].split(" ").length})
    `;
  }
}

export async function retrieveRelevantChunks(
  courseId: string,
  query: string,
  topK = 5
): Promise<string[]> {
  const queryEmbedding = await createEmbedding(query);
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  const results = await prisma.$queryRaw<{ content: string }[]>`
    SELECT dc.content
    FROM "DocumentChunk" dc
    JOIN "Document" d ON dc."documentId" = d.id
    WHERE d."courseId" = ${courseId}
      AND d.status = 'READY'
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `;

  return results.map((r: { content: string }) => r.content);
}
