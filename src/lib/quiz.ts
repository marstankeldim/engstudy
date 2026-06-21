import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { buildCourseContext } from "@/lib/ai-context";
import type { GeneratedQuestion, Difficulty, QuestionType } from "@/types";

// ─── Structured output schema ────────────────────────────────────────
const questionSchema = z.object({
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
  content: z.string().describe("The question text"),
  options: z
    .array(z.object({ id: z.string(), text: z.string() }))
    .nullable()
    .describe("4 options for MULTIPLE_CHOICE with ids A–D; null otherwise"),
  correctAnswer: z
    .string()
    .describe(
      "For MULTIPLE_CHOICE: the correct option id (e.g. 'A'). For TRUE_FALSE: 'true' or 'false'. For SHORT_ANSWER: the ideal answer."
    ),
  explanation: z.string().describe("Why the answer is correct"),
});

const quizSchema = z.object({
  questions: z.array(questionSchema),
});

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  EASY: "Focus on definitions, recall, and basic understanding. Keep questions straightforward.",
  MEDIUM: "Mix recall with application and conceptual understanding. Include some multi-step reasoning.",
  HARD: "Emphasize analysis, synthesis, edge cases, and multi-step problem solving. Make distractors plausible.",
};

interface GenerateQuizParams {
  courseId: string;
  documentIds: string[];
  difficulty: Difficulty;
  questionCount: number;
  questionTypes: QuestionType[];
}

export async function generateQuizQuestions(
  params: GenerateQuizParams
): Promise<GeneratedQuestion[]> {
  const { courseId, documentIds, difficulty, questionCount, questionTypes } = params;

  const context = await buildCourseContext(courseId, documentIds);

  const typeList = questionTypes.join(", ");
  const systemPrompt = `You are an expert engineering instructor creating exam questions.
You generate questions based ONLY on the provided course material. Never invent facts not supported by the material.

Rules:
- Generate exactly ${questionCount} questions.
- Use only these question types: ${typeList}. Distribute them reasonably.
- Difficulty: ${difficulty}. ${DIFFICULTY_GUIDANCE[difficulty]}
- For MULTIPLE_CHOICE: provide exactly 4 options with ids "A", "B", "C", "D"; set correctAnswer to the correct id.
- For TRUE_FALSE: set options to null; correctAnswer must be exactly "true" or "false".
- For SHORT_ANSWER: set options to null; correctAnswer is a concise ideal answer (1–3 sentences).
- Every question must include a clear explanation grounded in the material.
- Vary the topics covered so the quiz spans the material.`;

  const userPrompt = `Course material:\n\n${context}\n\nGenerate the quiz now.`;

  const completion = await getOpenAI().chat.completions.parse({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: zodResponseFormat(quizSchema, "quiz"),
    temperature: 0.7,
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Failed to generate quiz");

  // Normalize and guard against the model returning a disallowed type
  return parsed.questions
    .filter((q) => questionTypes.includes(q.type))
    .map((q) => ({
      type: q.type,
      content: q.content,
      options: q.options ?? undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));
}

// ─── Short-answer grading ────────────────────────────────────────────
const gradeSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string(),
});

export async function gradeShortAnswer(
  question: string,
  idealAnswer: string,
  userAnswer: string
): Promise<{ isCorrect: boolean; feedback: string }> {
  if (!userAnswer.trim()) return { isCorrect: false, feedback: "No answer provided." };

  const completion = await getOpenAI().chat.completions.parse({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You grade a student's short answer against an ideal answer. Be fair: award credit if the student captures the key idea, even with different wording. Mark incorrect only if the core concept is missing or wrong. Give one sentence of constructive feedback.",
      },
      {
        role: "user",
        content: `Question: ${question}\n\nIdeal answer: ${idealAnswer}\n\nStudent answer: ${userAnswer}`,
      },
    ],
    response_format: zodResponseFormat(gradeSchema, "grade"),
    temperature: 0,
  });

  const parsed = completion.choices[0]?.message.parsed;
  return parsed ?? { isCorrect: false, feedback: "Could not grade this answer." };
}
