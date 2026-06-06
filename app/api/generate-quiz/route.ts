import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const start = Date.now()
  console.log("[QuizGen API] POST /api/generate-quiz started")

  try {
    const body = await req.json();
    const text = body?.text;

    if (!text || typeof text !== "string") {
      console.error("[QuizGen API] Invalid body: text missing or not a string")
      return NextResponse.json(
        { success: false, error: "Text required" },
        { status: 400 }
      );
    }

    console.log("[QuizGen API] Text length:", text.length)

    const quiz = await generateQuiz(text);

    const questions = Array.isArray(quiz) ? quiz : [];

    console.log("[QuizGen API] Success, questions:", questions.length, `(${Date.now() - start}ms)`)

    return NextResponse.json({
      success: true,
      data: { questions },
    });

  } catch (err: unknown) {
    const elapsed = Date.now() - start
    const message = err instanceof Error ? err.message : "Quiz generation failed"
    console.error(`[QuizGen API] Error after ${elapsed}ms:`, err)

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}