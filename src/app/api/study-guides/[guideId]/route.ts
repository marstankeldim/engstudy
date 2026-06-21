import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

type Params = { params: Promise<{ guideId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { guideId } = await params;
    const guide = await prisma.studyGuide.findFirst({
      where: { id: guideId, course: { userId } },
      select: { id: true },
    });
    if (!guide) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.studyGuide.delete({ where: { id: guideId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[STUDY_GUIDE_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
