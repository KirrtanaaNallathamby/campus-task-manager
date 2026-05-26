"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

type Task = {
  id: string;
  subject: string;
  title: string;
  description: string;
  due_date: string;
  estimated_hours: number;
  difficulty: string;
  priority: string;
  status: string;
  action_plan: {
    steps: string[];
    schedule: string[];
    riskWarning: string;
  };
  rescue_plan: string;
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [rescueLoading, setRescueLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const router = useRouter();

  useEffect(() => {
    checkUserAndFetchTasks();
  }, []);

  async function checkUserAndFetchTasks() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    await fetchTasks(user.id);
    setAuthChecking(false);
  }

  async function fetchTasks(userId?: string) {
    let query = supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.log("FETCH TASKS ERROR:");
      console.log(error);

      alert(
        `${error.message}\n${error.details ?? ""}`
      );

      return;
    }

    setTasks(data || []);
  }

  async function toggleDone(task: Task) {
    const today = new Date();
    const due = new Date(task.due_date);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (task.status === "done" && today > due) {
      alert("This completed task is locked because the deadline has passed.");
      return;
    }

    const newStatus = task.status === "done" ? "pending" : "done";

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);

    if (error) {
      alert(error.message);
      return;
    }

    checkUserAndFetchTasks();

    if (selectedTask?.id === task.id) {
      setSelectedTask({ ...task, status: newStatus });
    }
  }

  async function deleteTask(taskId: string) {
    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) return;

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedTask(null);
    checkUserAndFetchTasks();
  }

  async function generateEmergencyPlan(task: Task) {
    try {
      setRescueLoading(true);

      const response = await fetch("/api/rescue-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to generate rescue plan.");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          rescue_plan: data.rescuePlan,
        })
        .eq("id", task.id);

      if (error) {
        alert(error.message);
        return;
      }

      const updatedTask = {
        ...task,
        rescue_plan: data.rescuePlan,
      };

      setSelectedTask(updatedTask);
      checkUserAndFetchTasks();
      alert("Emergency rescue plan updated.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setRescueLoading(false);
    }
  }

  function goToPreviousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
    setSelectedTask(null);
  }

  function goToNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
    setSelectedTask(null);
  }

  function goToToday() {
    setCurrentMonth(new Date());
    setSelectedTask(null);
  }

  const calendarDays = getMonthDays(currentMonth);

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((task) => task.status !== "done").length;
  const urgentTasks = tasks.filter(
    (task) => task.priority === "Urgent" && task.status !== "done"
  ).length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;

  const upcomingTasks = tasks.filter((task) => {
    const days = daysRemaining(task.due_date);

    return (
      task.status !== "done" &&
      days >= 0 &&
      days <= 3
    );
  });

  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const filteredTasks = tasks.filter((task) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      task.title?.toLowerCase().includes(search) ||
      task.subject?.toLowerCase().includes(search) ||
      task.description?.toLowerCase().includes(search);

    let matchesFilter = true;

    if (activeFilter === "pending") {
      matchesFilter = task.status !== "done";
    }

    if (activeFilter === "completed") {
      matchesFilter = task.status === "done";
    }

    if (activeFilter === "urgent") {
      matchesFilter = task.priority === "Urgent" && task.status !== "done";
    }

    return matchesSearch && matchesFilter;
  });

  async function logout() {
    await supabase.auth.signOut();
    router.push("/auth");
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
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm font-medium text-slate-500">
              ← Back to Home
            </Link>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              Academic Calendar
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              View all saved assignments by deadline and open each task to see
              its AI-generated plan.
            </p>
          </div>

          <Navbar />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            onClick={() => setActiveFilter("all")}
          />

          <StatCard
            label="Pending"
            value={pendingTasks}
            onClick={() => setActiveFilter("pending")}
          />

          <StatCard
            label="Urgent"
            value={urgentTasks}
            onClick={() => setActiveFilter("urgent")}
          />

          <StatCard
            label="Completed"
            value={completedTasks}
            onClick={() => setActiveFilter("completed")}
          />

          <StatCard
            label="Completion"
            value={`${completionRate}%`}
            onClick={() => {}}
          />
        </div>

        {upcomingTasks.length > 0 && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <h3 className="font-semibold text-orange-900">
              Upcoming Deadline Alert
            </h3>

            <div className="mt-3 space-y-2">
              {upcomingTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setCurrentMonth(new Date(task.due_date));
                  }}
                  className="block w-full rounded-xl bg-white p-3 text-left text-sm shadow-sm hover:bg-orange-100"
                >
                  <p className="font-medium text-orange-900">
                    {task.title}
                  </p>

                  <p className="text-orange-700">
                    Due in {daysRemaining(task.due_date)} day(s) • {task.subject}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Today's Focus
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Recommended tasks based on deadline urgency and workload.
          </p>

          <div className="mt-4 space-y-3">
            {tasks
              .filter((task) => task.status !== "done")
              .sort((a, b) => {
                const daysA = daysRemaining(a.due_date);
                const daysB = daysRemaining(b.due_date);

                return daysA - daysB;
              })
              .slice(0, 3)
              .map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">
                      {task.title}
                    </p>

                    <span className="text-sm text-slate-500">
                      {daysRemaining(task.due_date) < 0
                        ? "Overdue"
                        : `${daysRemaining(task.due_date)} day(s) left`}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {task.subject}
                  </p>

                  <p className="mt-3 text-sm font-medium text-blue-700">
                    {generateRecommendation(task)}
                  </p>
                </button>
              ))}
          </div>
        </div>

        {activeFilter !== "all" && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                {activeFilter === "pending"
                  ? "Pending Tasks"
                  : activeFilter === "urgent"
                  ? "Urgent Tasks"
                  : "Completed Tasks"}
              </h3>

              <button
                onClick={() => setActiveFilter("all")}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Clear Filter
              </button>
            </div>

            {filteredTasks.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No tasks found.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setCurrentMonth(new Date(task.due_date));
                    }}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                  >
                    <p className="font-medium text-slate-900">{task.title}</p>

                    <p className="text-sm text-slate-500">
                      {task.subject} • Due {task.due_date}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedTask(null);
          }}
          className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-slate-300"
        />

        {searchTerm && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">Search Results</h3>

            {filteredTasks.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No matching tasks found.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {filteredTasks.map((task) => (
                  <button
                    type="button"
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setCurrentMonth(new Date(task.due_date));
                      setSearchTerm("");
                    }}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                  >
                    <p className="font-semibold text-slate-900">
                      {task.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {task.subject} • Due {task.due_date} • {task.priority}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                {currentMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}{" "}
                • {filteredTasks.length} Tasks
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50"
                >
                  Prev
                </button>

                <button
                  onClick={goToToday}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50"
                >
                  Today
                </button>

                <button
                  onClick={goToNextMonth}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2 text-center text-sm font-medium text-slate-500">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const tasksForDay = filteredTasks.filter(
                  (task) => task.due_date === formatDate(day)
                );

                return (
                  <div
                    key={index}
                    className={`min-h-28 rounded-2xl border border-slate-200 p-2 ${
                      day.getMonth() === currentMonth.getMonth()
                        ? "bg-slate-50"
                        : "bg-white text-slate-300"
                    }`}
                  >
                    <div
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                        formatDate(day) === formatDate(new Date())
                          ? "bg-slate-900 text-white"
                          : ""
                      }`}
                    >
                      {day.getDate()}
                    </div>

                    <div className="mt-2 space-y-1">
                      {tasksForDay.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={`block w-full rounded-lg px-2 py-1 text-left text-xs ${
                            isOverdue(task.due_date)
                              ? "bg-red-100 text-red-800"
                              : task.status === "done"
                              ? "bg-green-100 text-green-800 line-through"
                              : task.priority === "Urgent"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "High"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          • {task.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {!selectedTask ? (
              <div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">
                    No task selected
                  </p>

                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>• View assignment details</li>
                    <li>• See AI action plans</li>
                    <li>• Track progress</li>
                    <li>• Generate rescue plans</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      {selectedTask.subject}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {selectedTask.title}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      selectedTask.priority === "Overdue"
                        ? "bg-red-100 text-red-700"
                        : selectedTask.priority === "Urgent"
                        ? "bg-red-100 text-red-700"
                        : selectedTask.priority === "High"
                        ? "bg-orange-100 text-orange-700"
                        : selectedTask.priority === "Medium"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {selectedTask.priority}
                  </span>
                </div>

                {isOverdue(selectedTask.due_date) ? (
                  <div className="mt-4 rounded-xl bg-red-100 p-3 text-sm font-medium text-red-700">
                    🚨 This assignment is overdue.
                  </div>
                ) : daysRemaining(selectedTask.due_date) <= 3 ? (
                  <div className="mt-4 rounded-xl bg-orange-100 p-3 text-sm font-medium text-orange-700">
                    ⚠ Deadline approaching ({daysRemaining(selectedTask.due_date)} day(s) left)
                  </div>
                ) : null}

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {selectedTask.description}
                </p>

                <div className="mt-4 grid gap-2 text-sm">
                  <DetailRow label="Due" value={selectedTask.due_date} />
                  <DetailRow
                    label="Estimated"
                    value={`${selectedTask.estimated_hours} hours`}
                  />
                  <DetailRow label="Difficulty" value={selectedTask.difficulty} />
                  <DetailRow label="Status" value={selectedTask.status} />
                </div>

                <button
                  onClick={() => toggleDone(selectedTask)}
                  className={`mt-5 w-full rounded-xl px-4 py-2 text-sm font-medium transition ${
                    selectedTask.status === "done"
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-slate-900 text-white hover:bg-slate-700"
                  }`}
                >
                  {selectedTask.status === "done" ? "Undo Done" : "Mark Done"}
                </button>

                <button
                  onClick={() => deleteTask(selectedTask.id)}
                  className="mt-3 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Delete Task
                </button>

                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900">Action Plan</h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                    {selectedTask.action_plan?.steps?.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                <button
                  onClick={() => generateEmergencyPlan(selectedTask)}
                  disabled={rescueLoading}
                  className="mt-5 w-full rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50"
                >
                  {rescueLoading
                    ? "Generating Emergency Plan..."
                    : "Generate Emergency Plan"}
                </button>

                <div className="mt-6 rounded-2xl bg-orange-50 p-4">
                  <h3 className="font-semibold text-orange-900">Rescue Plan</h3>
                  <p className="mt-2 text-sm leading-6 text-orange-800">
                    {selectedTask.rescue_plan}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number | string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:bg-slate-50 hover:shadow-md"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-400">Click to filter</p>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function generateRecommendation(task: Task) {
  const days = daysRemaining(task.due_date);

  if (days < 0) {
    return "Finish core deliverables immediately.";
  }

  if (days <= 2) {
    return "Focus on completing the most important section today.";
  }

  if (days <= 5) {
    return "Work on the most difficult component first.";
  }

  if (days <= 10) {
    return "Start implementation and testing.";
  }

  return "Begin research and planning.";
}

function getMonthDays(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  const days = [];

  for (let i = 0; i < 42; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }

  return days;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isOverdue(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

function daysRemaining(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = due.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}