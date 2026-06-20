import { prisma } from "@/lib/prisma";
import { createEmbedding, createEmbeddings } from "@/lib/openai";

const CHUNK_SIZE = 800; // words per chunk
const CHUNK_OVERLAP = 100;
const EMBED_BATCH = 96; // inputs per OpenAI embeddings request

export function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    if (chunk.trim()) chunks.push(chunk.trim());
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Chunks a document's text, embeds every chunk in batches, and stores the
 * vectors. Replaces any existing chunks for the document.
 */
export async function embedDocument(documentId: string, text: string): Promise<number> {
  const chunks = chunkText(text);
  if (chunks.length === 0) return 0;

  await prisma.documentChunk.deleteMany({ where: { documentId } });

  let globalIndex = 0;
  for (let start = 0; start < chunks.length; start += EMBED_BATCH) {
    const batch = chunks.slice(start, start + EMBED_BATCH);
    const vectors = await createEmbeddings(batch);

    for (let j = 0; j < batch.length; j++) {
      const vectorLiteral = `[${vectors[j].join(",")}]`;
      const content = batch[j];
      const tokenCount = content.split(/\s+/).length;
      await prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (id, "documentId", content, "chunkIndex", embedding, "tokenCount")
        VALUES (gen_random_uuid()::text, ${documentId}, ${content}, ${globalIndex}, ${vectorLiteral}::vector, ${tokenCount})
      `;
      globalIndex++;
    }
  }

  return globalIndex;
}

/**
 * Retrieves the most semantically relevant chunks across a course's
 * READY documents for a given query, using pgvector cosine distance.
 */
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
