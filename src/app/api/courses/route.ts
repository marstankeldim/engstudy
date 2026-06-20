import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/auth";
import { courseSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function GET() {
  try {
    const userId = await ensureUser();
    const courses = await prisma.course.findMany({
      where: { userId },
      include: {
        _count: {
          select: { documents: true, quizzes: true, flashcardDecks: true, studyGuides: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(courses);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[COURSES_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await ensureUser();
    const body = await req.json();
    const data = courseSchema.parse(body);

    const course = await prisma.course.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
        color: data.color,
        emoji: data.emoji,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[COURSES_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
