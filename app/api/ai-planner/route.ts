import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { instruction } = await req.json();

    if (!instruction) {
      return NextResponse.json(
        { error: "Instruction is required" },
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
You are an AI academic planning assistant.

Return ONLY valid JSON.
Do not use markdown.
Do not explain anything.
Do not wrap the JSON in backticks.

Use exactly this schema:

{
  "subject": "string",
  "title": "string",
  "description": "string",
  "dueDate": "YYYY-MM-DD",
  "actionPlan": ["string"],
  "suggestedSchedule": ["string"],
  "rescuePlan": "string",
  "riskWarning": "string"
}

Rules:
- Extract the assignment subject.
- Generate a concise assignment title.
- Generate a short academic project description.
- Extract the due date.
- Generate 5 to 8 action plan steps.

- Generate a realistic study schedule for a university student.
- The schedule must start from today and end on the assignment due date.
- Do NOT create timelines spanning months or years.
- Do NOT generate software project lifecycle schedules.
- Each schedule item must be actionable and practical.
- Suggested schedule should be organised as Day 1, Day 2, Day 3, etc but not more than the days left for due date.
- Allocate research, implementation, testing, documentation, and review across the available days.

- Generate a practical rescue plan.
- Generate a realistic risk warning.
- Return VALID JSON ONLY.
- Do not include extra fields.
- Do not include markdown.

Example suggestedSchedule:

[
  "Day 1: Understand requirements and create project outline",
  "Day 2: Research and prepare resources",
  "Day 3: Implement core functionality",
  "Day 4: Continue implementation and testing",
  "Day 5: Documentation and report writing",
  "Day 6: Final review and submission preparation"
]

Assignment Instruction:

${instruction}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log("Gemini API error:", data);

      return NextResponse.json(
        {
          error: "Gemini API request failed",
          details: data,
        },
        { status: 500 }
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.log("Empty Gemini response:", data);

      return NextResponse.json(
        {
          error: "Gemini returned empty response",
          details: data,
        },
        { status: 500 }
      );
    }

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.log("Invalid Gemini JSON:", cleaned);

      return NextResponse.json(
        {
          error: "Gemini returned invalid JSON",
          details: cleaned,
        },
        { status: 500 }
      );
    }

    const formattedResult = {
      subject: parsed.subject || "",
      title: parsed.title || "Generated Academic Task",
      description: parsed.description || "",
      dueDate: parsed.dueDate || "",
      actionPlan: Array.isArray(parsed.actionPlan)
        ? parsed.actionPlan
        : [],
      suggestedSchedule: Array.isArray(parsed.suggestedSchedule)
        ? parsed.suggestedSchedule
        : [],
      rescuePlan: parsed.rescuePlan || "",
      riskWarning: parsed.riskWarning || "",
    };

    return NextResponse.json(formattedResult);
  } catch (error) {
    console.error("AI planner error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate plan",
      },
      {
        status: 500,
      }
    );
  }
}