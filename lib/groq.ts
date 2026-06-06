import Groq from "groq-sdk";
import { QuizQuestion } from "@/types";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function generateQuiz(text: string): Promise<QuizQuestion[]> {
  const truncated = text.slice(0, 12000);

  const prompt = `
You are an expert language teacher and quiz generator.

STRICT RULES:
- Return ONLY valid JSON
- Exactly 10 MCQ questions
- Each question has exactly 4 options
- Only one correct answer per question
- The "answer" field must be the FULL TEXT of the correct option, not a letter
- No explanations, no markdown

FORMAT:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "answer": "Paris"
  }
]

LESSON:
${truncated}
`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a strict JSON quiz generator.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from Groq");
  }

  // clean response (important)
  const cleaned = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log("RAW RESPONSE:", content);
    throw new Error("Invalid JSON from AI");
  }
}