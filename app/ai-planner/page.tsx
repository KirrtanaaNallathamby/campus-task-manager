"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { calculatePriority } from "@/lib/priority";
import { estimateWorkload, calculateDifficulty } from "@/lib/workload";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

type AIResult = {
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  estimatedHours: number;
  difficulty: string;
  priority: string;
  actionPlan: string[];
  suggestedSchedule: string[];
  rescuePlan: string;
  riskWarning: string;
};

export default function AIPlannerPage() {
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthChecking(false);
      router.push("/auth");
      return;
    }
    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    setCourses(courseData || []);
    setAuthChecking(false);
  }

  async function generatePlan() {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/ai-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instruction }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to generate plan.");
        return;
      }

      const finalPriority = calculatePriority(data.dueDate);
      const finalHours = estimateWorkload(instruction, data.actionPlan || []);
      const finalDifficulty = calculateDifficulty(finalHours);

      setResult({
        ...data,
        estimatedHours: finalHours,
        difficulty: finalDifficulty,
        priority: finalPriority,
      });
    } catch (error) {
      console.error(error);
      alert("Something went wrong while generating the plan.");
    } finally {
      setLoading(false);
    }
  }

  async function saveTask() {
    if (!selectedCourse) {
      alert("Please select a course.");
      return;
    }
    
    if (!result) return;

    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first.");
        return;
      }

      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        course_id: selectedCourse,
        subject:
          courses.find((course) => course.id === selectedCourse)?.name ||
          result.subject,
        title: result.title,
        description: result.description,
        due_date: result.dueDate,
        estimated_hours: result.estimatedHours,
        difficulty: result.difficulty,
        priority: result.priority,
        status: "pending",
        action_plan: {
          steps: result.actionPlan,
          schedule: result.suggestedSchedule,
          riskWarning: result.riskWarning,
        },
        rescue_plan: result.rescuePlan,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Task saved successfully.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  if (authChecking) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef]">
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-slate-900">
          Checking your session...
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Please wait a moment.
        </p>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-slate-500">
            ← Back to Home
          </Link>
          <Navbar />
          
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              AI Assignment Planner
            </p>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-900">
              Paste your assignment brief. Get a clear plan back.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Campus Task Manager uses AI to break assignment instructions into
              action steps, workload estimates, deadlines, and rescue plans.
            </p>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Try this example:
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                For Database Systems assignment, design a university course
                registration system. Create ERD, normalize tables to 3NF,
                implement SQL queries, and prepare a report. Submission deadline
                is 15 June 2026.
              </p>

              <button
                type="button"
                onClick={() =>
                  setInstruction(
                    "For Database Systems assignment, design a university course registration system. Create ERD, normalize tables to 3NF, implement SQL queries, and prepare a report. Submission deadline is 15 June 2026."
                  )
                }
                className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Use Example
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <label className="text-sm font-semibold text-slate-900">
              Course
            </label>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="mt-3 mb-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-300"
            >
              <option value="">
                Select a course
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.name}
                </option>
              ))}
            </select>

            <label className="text-sm font-semibold text-slate-900">
              Assignment Instructions
            </label>

            <textarea
              className="mt-3 h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-300"
              placeholder="Paste assignment instruction here..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />

            <button
              onClick={generatePlan}
              disabled={loading || instruction.trim() === ""}
              className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Generating your plan..." : "Generate Plan"}
            </button>
          </div>
        </section>

        {result && (
          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Generated Academic Plan
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {result.title}
                </h2>

                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  {result.description}
                </p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  result.priority === "Overdue"
                    ? "bg-red-100 text-red-700"
                    : result.priority === "Urgent"
                    ? "bg-red-100 text-red-700"
                    : result.priority === "High"
                    ? "bg-orange-100 text-orange-700"
                    : result.priority === "Medium"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {result.priority}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <InfoCard
                label="Course"
                value={
                  courses.find(
                    (c) => c.id === selectedCourse
                  )?.name || "-"
                }
              />
              <InfoCard label="Subject" value={result.subject} />
              <InfoCard label="Due Date" value={result.dueDate} />
              <InfoCard
                label="Days Remaining"
                value={
                  daysRemaining(result.dueDate) < 0
                    ? "Overdue"
                    : `${daysRemaining(result.dueDate)} days`
                }
              />
              <InfoCard
                label="Estimated Workload"
                value={`${result.estimatedHours} hours`}
              />
              <InfoCard label="Difficulty" value={result.difficulty} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <PlanSection
                title="Step-by-step Action Plan"
                items={result.actionPlan || []}
              />

              <PlanSection
                title="Suggested Schedule"
                items={result.suggestedSchedule || []}
              />
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-orange-50 p-5">
                <h3 className="font-semibold text-orange-900">Rescue Plan</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-orange-800">
                  {result.rescuePlan}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-5">
                <h3 className="font-semibold text-red-900">Risk Warning</h3>
                <p className="mt-2 text-sm leading-6 text-red-800">
                  {result.riskWarning}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={saveTask}
                disabled={saving}
                className="rounded-2xl bg-green-700 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-green-800 disabled:opacity-50"
              >
                {saving ? "Saving Task..." : "Save Task"}
              </button>

              <Link
                href="/dashboard"
                className="rounded-2xl border border-slate-200 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Go to Dashboard
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function PlanSection({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900">{title}</h3>

      {items && items.length > 0 ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No plan generated.</p>
      )}
    </div>
  );
}

function daysRemaining(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff =
    due.getTime() - today.getTime();

  return Math.ceil(
    diff / (1000 * 60 * 60 * 24)
  );
}