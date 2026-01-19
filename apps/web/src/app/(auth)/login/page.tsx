"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onLogin() {
    setMsg("Logging in...");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error || "Login failed");
      return;
    }

    setMsg("Login successful ✅ Redirecting...");
    window.location.href = "/dashboard";
  }

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", fontFamily: "Arial" }}>
      <h1>InvoiceMe Organizer</h1>
      <p>Login with your company email + password provided by admin.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10 }}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10 }}
        />
        <button onClick={onLogin} style={{ padding: 10, cursor: "pointer" }}>
          Login
        </button>
      </div>

      <p style={{ marginTop: 16 }}>{msg}</p>
    </div>
  );
}
