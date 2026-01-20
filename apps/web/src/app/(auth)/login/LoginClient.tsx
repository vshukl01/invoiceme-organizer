"use client";

// apps/web/src/app/(auth)/login/LoginClient.tsx
import { useState } from "react";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error || "Login failed");
        return;
      }

      // go to dashboard after login
      window.location.href = "/dashboard";
    } catch {
      setMsg("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10 }}
          autoComplete="email"
        />
        <input
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10 }}
          type="password"
          autoComplete="current-password"
        />

        <button disabled={loading} style={{ padding: 10, cursor: "pointer" }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {msg ? <div style={{ color: "crimson" }}>{msg}</div> : null}
      </form>
    </div>
  );
}
