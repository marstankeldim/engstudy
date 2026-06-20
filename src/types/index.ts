import type {
  Course,
  Document,
  DocumentChunk,
  Quiz,
  Question,
  QuizAttempt,
  Answer,
  FlashcardDeck,
  Flashcard,
  FlashcardProgress,
  StudyGuide,
  PracticeExam,
  TutorMessage,
  StudySession,
  User,
} from "@/generated/prisma/client";

import type { $Enums } from "@/generated/prisma/client";

export type Difficulty = $Enums.Difficulty;
export type QuestionType = $Enums.QuestionType;
export type DocumentStatus = $Enums.DocumentStatus;
export type StudyGuideType = $Enums.StudyGuideType;
export type SessionType = $Enums.SessionType;
export type MessageRole = $Enums.MessageRole;

export type {
  Course,
  Document,
  DocumentChunk,
  Quiz,
  Question,
  QuizAttempt,
  Answer,
  FlashcardDeck,
  Flashcard,
  FlashcardProgress,
  StudyGuide,
  PracticeExam,
  TutorMessage,
  StudySession,
  User,
};

// Enriched types used across the app
export type CourseWithCounts = Course & {
  _count: {
    documents: number;
    quizzes: number;
    flashcardDecks: number;
    studyGuides: number;
  };
};

export type QuizWithQuestions = Quiz & { questions: Question[] };

export type FlashcardDeckWithCards = FlashcardDeck & { cards: Flashcard[] };

export type FlashcardWithProgress = Flashcard & {
  progress: FlashcardProgress[];
};

export type QuizAttemptWithAnswers = QuizAttempt & { answers: Answer[] };

export type MCQOption = { id: string; text: string };

// AI generation payloads
export interface GeneratedQuestion {
  type: QuestionType;
  content: string;
  options?: MCQOption[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
  tags: string[];
}

export interface GeneratedStudyGuide {
  title: string;
  content: string;
}

// Dashboard stats
export interface DashboardStats {
  totalCourses: number;
  totalDocuments: number;
  quizzesTaken: number;
  averageScore: number | null;
  studyStreak: number;
  cardsReviewedToday: number;
}
