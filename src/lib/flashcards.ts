import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { buildCourseContext } from "@/lib/ai-context";
import type { GeneratedFlashcard } from "@/types";

const flashcardSchema = z.object({
  front: z.string().describe("The prompt side: a term, concept, formula name, or question"),
  back: z.string().describe("The answer side: definition, formula, or explanation"),
  tags: z.array(z.string()).describe("1–3 short topic tags"),
});

const deckSchema = z.object({
  cards: z.array(flashcardSchema),
});

interface GenerateFlashcardsParams {
  courseId: string;
  documentIds: string[];
  cardCount: number;
}

export async function generateFlashcards(
  params: GenerateFlashcardsParams
): Promise<GeneratedFlashcard[]> {
  const { courseId, documentIds, cardCount } = params;

  const context = await buildCourseContext(courseId, documentIds);

  const systemPrompt = `You are an expert engineering tutor creating study flashcards.
Create flashcards based ONLY on the provided course material. Never invent facts.

Rules:
- Generate exactly ${cardCount} flashcards.
- Each card has a concise front (prompt) and a clear, self-contained back (answer).
- Prioritize: key definitions, important formulas (write them clearly), core concepts, and critical facts.
- For formulas, put the formula name/use on the front and the formula + variable meanings on the back.
- Keep fronts short and answerable; keep backs accurate and complete but concise.
- Add 1–3 short topic tags per card.
- Cover a range of topics across the material; avoid duplicates.`;

  const userPrompt = `Course material:\n\n${context}\n\nGenerate the flashcards now.`;

  const completion = await getOpenAI().chat.completions.parse({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: zodResponseFormat(deckSchema, "deck"),
    temperature: 0.6,
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Failed to generate flashcards");

  return parsed.cards.map((c) => ({
    front: c.front,
    back: c.back,
    tags: c.tags,
  }));
}
