import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "@/lib/groq";

export async function POST(req: NextRequest) {
  console.log("🔥 generate-quiz API called");

  try {
    const body = await req.json();
    const text = body?.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Text required" },
        { status: 400 }
      );
    }

    const quiz = await generateQuiz(text);

    const questions = Array.isArray(quiz) ? quiz : [];

    return NextResponse.json({
      success: true,
      data: { questions },
    });

  } catch (err: any) {
    console.error("QUIZ API ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Quiz generation failed",
      },
      { status: 500 }
    );
  }
}