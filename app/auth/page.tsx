"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const router = useRouter();

  async function handleAuth() {
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Account created successfully. Please login.");
      setIsLogin(true);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          {isLogin ? "Login" : "Create Account"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-slate-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-slate-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleAuth}
          className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-white"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-sm text-blue-600"
        >
          {isLogin
            ? "Need an account? Sign Up"
            : "Already have an account? Login"}
        </button>
      </div>
    </main>
  );
}