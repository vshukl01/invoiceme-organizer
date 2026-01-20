"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  org_id: string;
  email: string;
  is_admin: boolean;
};

type Job = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
};

export default function DashboardClient({ user }: { user: User }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rawFolderId, setRawFolderId] = useState("");
  const [docsFolderId, setDocsFolderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadJobs() {
    const res = await fetch("/api/jobs/list", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setJobs(data.jobs || []);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function saveFolders() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/drive/save-folders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rawFolderId: rawFolderId.trim(),
          docsFolderId: docsFolderId.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save folders");
      setMsg("Saved folder IDs ✅");
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function createJob() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/jobs/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create job");
      setMsg(`Job created ✅ (${data.jobId})`);
      await loadJobs();
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 6 }}>Dashboard</h1>
      <div style={{ opacity: 0.75, marginBottom: 18 }}>
        Logged in as <b>{user.email}</b>
      </div>

      <section style={{ border: "1px solid #333", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Google Drive Folders</h2>

        <label style={{ display: "block", marginBottom: 8 }}>
          RAW Folder ID
          <input
            value={rawFolderId}
            onChange={(e) => setRawFolderId(e.target.value)}
            placeholder="paste RAW folder id"
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          DOCS Folder ID
          <input
            value={docsFolderId}
            onChange={(e) => setDocsFolderId(e.target.value)}
            placeholder="paste DOCS folder id"
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button onClick={saveFolders} disabled={loading} style={{ padding: "10px 14px" }}>
          Save folders
        </button>
      </section>

      <section style={{ border: "1px solid #333", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Jobs</h2>

        <button onClick={createJob} disabled={loading} style={{ padding: "10px 14px", marginBottom: 10 }}>
          Create Job
        </button>

        {jobs.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No jobs yet.</div>
        ) : (
          <ul>
            {jobs.map((j) => (
              <li key={j.id} style={{ marginBottom: 8 }}>
                <b>{j.status}</b> — {j.message || ""} <span style={{ opacity: 0.6 }}>({j.id})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {msg ? <div style={{ marginTop: 10 }}>{msg}</div> : null}
    </main>
  );
}
