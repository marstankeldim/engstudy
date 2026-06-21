import { BookOpen, FileText, ListChecks, Sigma } from "lucide-react";
import type { StudyGuideType } from "@/types";

export const GUIDE_TYPES: Record<
  StudyGuideType,
  { label: string; description: string; icon: typeof BookOpen }
> = {
  SUMMARY: {
    label: "Topic Summary",
    description: "Organized overview of the key topics",
    icon: BookOpen,
  },
  EXAM_REVIEW: {
    label: "Exam Review Sheet",
    description: "Focused review for last-minute studying",
    icon: ListChecks,
  },
  FORMULA_SHEET: {
    label: "Formula Sheet",
    description: "Every formula, equation, and constant",
    icon: Sigma,
  },
  KEY_TAKEAWAYS: {
    label: "Key Takeaways",
    description: "The most important points to remember",
    icon: FileText,
  },
};

export const GUIDE_TYPE_ORDER: StudyGuideType[] = [
  "SUMMARY",
  "EXAM_REVIEW",
  "FORMULA_SHEET",
  "KEY_TAKEAWAYS",
];
