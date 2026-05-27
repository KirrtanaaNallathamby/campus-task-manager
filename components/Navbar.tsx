"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function navClass(path: string) {
    const active = pathname === path;

    return active
    ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-slate-900 hover:text-white hover:shadow-lg";
  }

  return (
    <div className="flex gap-3">
      <Link
        href="/dashboard"
        className={navClass("/dashboard")}
      >
        Calendar
      </Link>

      <Link
        href="/courses"
        className={navClass("/courses")}
      >
        Courses
      </Link>

      <Link
        href="/ai-planner"
        className={navClass("/ai-planner")}
      >
        Task Planner
      </Link>

      <button
        onClick={logout}
        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-red-100 hover:shadow-lg"
      >
        Logout
      </button>
    </div>
  );
}