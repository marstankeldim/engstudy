import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

const sessionSchema = z.object({
  courseId: z.string().optional(),
  type: z.enum(["QUIZ", "FLASHCARDS", "STUDY_GUIDE", "TUTOR", "PRACTICE_EXAM"]),
  duration: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId, type, duration } = sessionSchema.parse(await req.json());

    // If a courseId is supplied, ensure the user owns it
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: { id: courseId, userId },
        select: { id: true },
      });
      if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.studySession.create({
      data: {
        userId,
        courseId: courseId ?? null,
        type,
        duration: duration ?? null,
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
    }
    console.error("[STUDY_SESSION]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
