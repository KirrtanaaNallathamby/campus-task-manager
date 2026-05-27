"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

type Course = {
  id: string;
  name: string;
  code: string | null;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    checkUserAndFetchCourses();
  }, []);

  async function checkUserAndFetchCourses() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    fetchCourses(user.id);
  }

  async function fetchCourses(userId: string) {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setCourses(data || []);
  }

  async function addCourse() {
    if (name.trim() === "") {
      alert("Please enter course name.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { error } = await supabase.from("courses").insert({
        user_id: user.id,
        name,
        code: code || null,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setName("");
      setCode("");
      fetchCourses(user.id);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCourse(courseId: string) {
    const confirmed = confirm("Delete this course?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      alert(error.message);
      return;
    }

    checkUserAndFetchCourses();
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-slate-500">
            ← Back to Home
          </Link>
            <Navbar />
            
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              Course Setup
            </p>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-900">
              Tell Campus Task Manager what courses you are taking.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Your courses help organise assignments by subject and make study focus
              suggestions more useful.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <label className="text-sm font-semibold text-slate-900">
              Course Name
            </label>

            <input
              type="text"
              placeholder="Example: Deep Learning"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-slate-300"
            />

            <label className="mt-5 block text-sm font-semibold text-slate-900">
              Course Code (optional)
            </label>

            <input
              type="text"
              placeholder="Example: WIA3007"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-slate-300"
            />

            <button
              onClick={addCourse}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-slate-700 hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Adding Course..." : "Add Course"}
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">My Courses</h2>

          {courses.length === 0 ? (
            <p className="mt-3 text-slate-500">
              No courses added yet. Add your first course above.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 transition duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {course.name}
                    </p>

                    {course.code && (
                      <p className="text-sm text-slate-500">{course.code}</p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="rounded-xl bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition duration-200 hover:-translate-y-1 hover:bg-red-200 hover:shadow-md"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}