import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { openai, CHAT_MODEL } from "@/lib/openai";
import { retrieveRelevantChunks } from "@/lib/embeddings";

type Params = { params: Promise<{ courseId: string }> };

export const maxDuration = 60;

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
});

const HISTORY_LIMIT = 16; // last N messages sent as conversational context

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
      select: { id: true, name: true },
    });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { message } = chatSchema.parse(await req.json());

    // 1. Retrieve grounding context + recent history (before saving new msg)
    const [chunks, history] = await Promise.all([
      retrieveRelevantChunks(courseId, message, 6).catch(() => [] as string[]),
      prisma.tutorMessage.findMany({
        where: { userId, courseId },
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT,
      }),
    ]);

    // 2. Persist the user's message immediately
    await prisma.tutorMessage.create({
      data: { userId, courseId, role: "USER", content: message },
    });

    // 3. Build the grounded prompt
    const contextBlock =
      chunks.length > 0
        ? `Relevant excerpts from the student's course materials:\n\n${chunks
            .map((c, i) => `[Excerpt ${i + 1}]\n${c}`)
            .join("\n\n")}`
        : "No specific course material was retrieved for this question.";

    const systemPrompt = `You are an expert, encouraging AI tutor for the course "${course.name}".
Help the student understand their material deeply. Explain concepts step by step, give worked examples, and check understanding.

Ground your answers in the provided course excerpts whenever they are relevant. If the excerpts don't cover the question, say so briefly, then help using your general knowledge — but never fabricate course-specific facts.

Use Markdown: headings, bullet points, and code blocks where helpful. Write formulas in clear plain text (e.g. F = m * a), not LaTeX.

${contextBlock}`;

    const conversation = history
      .reverse()
      .map((m) => ({
        role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

    // 4. Stream the completion, persisting the full reply on completion
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      stream: true,
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversation,
        { role: "user", content: message },
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let full = "";
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) {
              full += delta;
              controller.enqueue(encoder.encode(delta));
            }
          }
        } catch (err) {
          console.error("[TUTOR_STREAM]", err);
        } finally {
          if (full.trim()) {
            await prisma.tutorMessage.create({
              data: { userId, courseId, role: "ASSISTANT", content: full },
            });
            await prisma.studySession.create({
              data: { userId, courseId, type: "TUTOR", endedAt: new Date() },
            });
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
    }
    console.error("[TUTOR_POST]", error);
    return NextResponse.json({ error: "Tutor failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
      select: { id: true },
    });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.tutorMessage.deleteMany({ where: { userId, courseId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TUTOR_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
