-- Performant approximate nearest-neighbour index for RAG retrieval.
-- pgvector's HNSW index speeds up the cosine-distance search used by the
-- AI Tutor. Run after `prisma db push` (which creates the table + extension).
CREATE INDEX IF NOT EXISTS documentchunk_embedding_idx
  ON "DocumentChunk" USING hnsw (embedding vector_cosine_ops);
