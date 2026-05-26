"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
    setCheckingUser(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <nav className="mb-10 flex items-center justify-between">
          <p className="text-lg font-bold text-slate-900">Campus Task Manager</p>

          {!checkingUser &&
            (user ? (
              <Navbar />
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/auth"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-900 hover:text-white"
                >
                  Login
                </Link>

                <Link
                  href="/auth"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            ))}
        </nav>

        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              Built for students with too many deadlines
            </p>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-900">
              Manage coursework, deadlines, and study plans in one place.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              An AI-powered academic planning tool that helps students organise
              courses, turn assignment briefs into action plans, track deadlines,
              and focus on what to do next.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {user ? (
                <>
                  <Link
                    href="/ai-planner"
                    className="rounded-2xl bg-slate-900 px-6 py-4 font-medium text-white shadow-sm hover:bg-slate-700"
                  >
                    Create my plan
                  </Link>

                  <Link
                    href="/dashboard"
                    className="rounded-2xl bg-white px-6 py-4 font-medium text-slate-700 shadow-sm hover:bg-slate-100"
                  >
                    View calendar
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="rounded-2xl bg-slate-900 px-6 py-4 font-medium text-white shadow-sm hover:bg-slate-700"
                  >
                    Get Started
                  </Link>

                </>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">How it works</h2>

            <div className="mt-5 space-y-4">
              <HomeStep
                number="01"
                title="Paste your assignment instructions"
              />

              <HomeStep
                number="02"
                title="AI generates a structured study plan"
              />

              <HomeStep
                number="03"
                title="Save tasks into your academic calendar"
              />

              <HomeStep
                number="04"
                title="Generate emergency rescue plans when needed"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Paste, don’t overthink"
            text="Students can paste assignment instructions directly instead of manually creating every task."
          />

          <FeatureCard
            title="See deadlines clearly"
            text="Saved tasks appear on an academic calendar so upcoming work is easier to track."
          />

          <FeatureCard
            title="Recover when behind"
            text="Emergency rescue plans help students focus on what matters when the deadline is near."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function HomeStep({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
        {number}
      </div>

      <p className="font-medium text-slate-800">{title}</p>
    </div>
  );
}