import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { generateStudyGuideSchema } from "@/lib/validations";
import { generateStudyGuide } from "@/lib/study-guide";

type Params = { params: Promise<{ courseId: string }> };

export const maxDuration = 120;

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
      select: { id: true },
    });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const input = generateStudyGuideSchema.parse(await req.json());

    const { title, content } = await generateStudyGuide({
      courseId,
      documentIds: input.documentIds,
      type: input.type,
    });

    const guide = await prisma.studyGuide.create({
      data: { courseId, title, content, type: input.type },
    });

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
    }
    console.error("[STUDY_GUIDE_GENERATE]", error);
    return NextResponse.json({ error: "Failed to generate study guide" }, { status: 500 });
  }
}
