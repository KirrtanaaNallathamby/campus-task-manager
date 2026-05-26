import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { task } = await req.json();

    if (!task) {
      return NextResponse.json(
        { error: "Task is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is missing" },
        { status: 500 }
      );
    }

    const prompt = `
You are an academic emergency planning assistant.

Create a short, realistic emergency rescue plan for this student task.

Task title: ${task.title}
Subject: ${task.subject}
Due date: ${task.due_date}
Estimated hours: ${task.estimated_hours}
Difficulty: ${task.difficulty}
Current status: ${task.status}

Existing action steps:
${task.action_plan?.steps?.join("\n") || "No steps provided"}

Return ONLY valid JSON in this format:
{
  "rescuePlan": "string"
}

The rescue plan must be practical, student-friendly, and divided into Today, Tomorrow, and Final Check if suitable.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gemini request failed", details: data },
        { status: 500 }
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned empty response" },
        { status: 500 }
      );
    }

    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      rescuePlan: parsed.rescuePlan || ""
    });
  } catch (error) {
    console.error("Rescue plan error:", error);

    return NextResponse.json(
      { error: "Failed to generate rescue plan" },
      { status: 500 }
    );
  }
}