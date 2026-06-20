import { z } from "zod";

export const courseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
    .default("#6366f1"),
  emoji: z.string().min(1).max(8).default("📚"),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const generateQuizSchema = z.object({
  documentIds: z.array(z.string()).min(1, "Select at least one document"),
  title: z.string().min(1).max(120),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  questionCount: z.number().int().min(1).max(30).default(10),
  questionTypes: z
    .array(z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]))
    .min(1)
    .default(["MULTIPLE_CHOICE"]),
  timeLimit: z.number().int().min(0).max(240).nullable().optional(),
});

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;

export const generateFlashcardsSchema = z.object({
  documentIds: z.array(z.string()).min(1),
  title: z.string().min(1).max(120),
  cardCount: z.number().int().min(1).max(50).default(15),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

export const generateStudyGuideSchema = z.object({
  documentIds: z.array(z.string()).min(1),
  type: z.enum(["SUMMARY", "EXAM_REVIEW", "FORMULA_SHEET", "KEY_TAKEAWAYS"]),
});

export type GenerateStudyGuideInput = z.infer<typeof generateStudyGuideSchema>;
