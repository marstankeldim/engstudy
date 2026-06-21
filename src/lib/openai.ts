import OpenAI from "openai";

// Lazily construct the client on first use. The OpenAI SDK throws in its
// constructor when no API key is set, and Next.js evaluates server modules at
// build time (page-data collection) — so eager construction would crash the
// build whenever OPENAI_API_KEY isn't present in the build environment.
let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const CHAT_MODEL = "gpt-4o" as const;
export const EMBEDDING_MODEL = "text-embedding-3-small" as const;
export const EMBEDDING_DIMENSIONS = 1536 as const;

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

/**
 * Embeds many texts in a single API call. OpenAI allows up to 2048 inputs
 * per request; callers should batch beyond that.
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  // Ensure output order matches input order
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
