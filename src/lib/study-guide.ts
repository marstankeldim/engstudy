import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { openai, CHAT_MODEL } from "@/lib/openai";
import { buildCourseContext } from "@/lib/ai-context";
import type { GeneratedStudyGuide, StudyGuideType } from "@/types";

const guideSchema = z.object({
  title: z.string().describe("A concise, descriptive title for the study guide"),
  content: z.string().describe("The full study guide in GitHub-flavored Markdown"),
});

const TYPE_PROMPTS: Record<StudyGuideType, string> = {
  SUMMARY: `Create a clear topic SUMMARY. Organize by major topic with ## headings.
Under each, give concise explanations of the key ideas in prose and bullet points.
Aim for comprehension and review, not exhaustive transcription.`,

  EXAM_REVIEW: `Create an EXAM REVIEW SHEET. Structure it for last-minute studying:
- Start with a short "What to focus on" section.
- Use ## headings per topic, with the most exam-relevant points as bullets.
- Include "Common pitfalls" and "Likely exam questions" where appropriate.`,

  FORMULA_SHEET: `Create a FORMULA SHEET. List every important formula, equation, and constant.
- Group formulas under ## topic headings.
- For each formula: write it clearly in plain text (e.g. F = m * a), then briefly define each variable and its units.
- Use a markdown table when listing many related formulas. Do NOT use LaTeX syntax.`,

  KEY_TAKEAWAYS: `Create a KEY TAKEAWAYS sheet. Distill the material into the most important
points a student must remember. Use ## headings per topic and tight, memorable bullet points.
Bold the single most critical idea in each section.`,
};

interface GenerateStudyGuideParams {
  courseId: string;
  documentIds: string[];
  type: StudyGuideType;
}

export async function generateStudyGuide(
  params: GenerateStudyGuideParams
): Promise<GeneratedStudyGuide> {
  const { courseId, documentIds, type } = params;

  const context = await buildCourseContext(courseId, documentIds);

  const systemPrompt = `You are an expert engineering instructor creating study materials.
Base everything ONLY on the provided course material. Never invent facts.

${TYPE_PROMPTS[type]}

Formatting rules:
- Output valid GitHub-flavored Markdown.
- Use headings, bullet points, bold, and tables to make it scannable.
- Do not include a top-level # H1 title (that is stored separately).
- Keep it accurate, well-organized, and genuinely useful for studying.`;

  const userPrompt = `Course material:\n\n${context}\n\nGenerate the study guide now.`;

  const completion = await openai.chat.completions.parse({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: zodResponseFormat(guideSchema, "study_guide"),
    temperature: 0.5,
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Failed to generate study guide");

  return { title: parsed.title, content: parsed.content };
}
