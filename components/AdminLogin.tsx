"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <input
        type="password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-lg border border-slate-600 bg-asia-panel px-4 py-3 text-slate-100 outline-none focus:border-asia-accent2"
        autoFocus
      />
      {error && <p className="text-sm text-asia-accent">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !password}
        className="rounded-full bg-asia-accent2 px-6 py-3 font-bold text-asia-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
