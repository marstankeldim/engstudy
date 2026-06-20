import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { courseSchema } from "@/lib/validations";
import { ZodError } from "zod";

type Params = { params: Promise<{ courseId: string }> };

async function getOwnedCourse(courseId: string, userId: string) {
  return prisma.course.findFirst({ where: { id: courseId, userId } });
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
      include: {
        _count: {
          select: { documents: true, quizzes: true, flashcardDecks: true, studyGuides: true },
        },
      },
    });

    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(course);
  } catch (error) {
    console.error("[COURSE_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const owned = await getOwnedCourse(courseId, userId);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const data = courseSchema.partial().parse(body);

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.emoji !== undefined && { emoji: data.emoji }),
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
    }
    console.error("[COURSE_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const owned = await getOwnedCourse(courseId, userId);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COURSE_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
