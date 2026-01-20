"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  message: string;
  created_at: string;
};

type Item = {
  id: string;
  source_filename: string;
  doc_type: string;
  extracted_date: string;
  extracted_company: string;
  doc_number: string;
  output_path: string;
  status: string;
  error: string;
};

function getUserFromCookie(): User | null {
  const cookie = document.cookie.split("; ").find((c) => c.startsWith("invoiceme_user="));
  if (!cookie) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie.split("=")[1]));
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  const [rawFolderId, setRawFolderId] = useState("");
  const [docsFolderId, setDocsFolderId] = useState("");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>("");

  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const u = getUserFromCookie();
    if (!u) {
      window.location.href = "/(auth)/login";
      return;
    }
    setUser(u);
  }, []);

  async function saveFolders() {
    if (!user) return;
    setMsg("Saving folders...");

    const res = await fetch("/api/drive/save-folders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        rawFolderId,
        docsFolderId
      })
    });

    const data = await res.json();
    if (!data.ok) {
      setMsg("Error: " + data.error);
      return;
    }

    setMsg("Saved ✅");
  }

  async function refreshJobs() {
    if (!user) return;
    const res = await fetch(`/api/jobs/list?orgId=${user.org_id}`);
    const data = await res.json();
    if (data.ok) setJobs(data.jobs || []);
  }

  async function startJob() {
    if (!user) return;

    setMsg("Creating job + starting worker...");
    const res = await fetch("/api/jobs/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: user.id })
    });

    const data = await res.json();
    if (!data.ok) {
      setMsg("Error: " + data.error);
      return;
    }

    setActiveJobId(data.jobId);
    setMsg("Job started ✅ Job ID: " + data.jobId);

    await refreshJobs();
  }

  async function refreshItems(jobId: string) {
    const res = await fetch(`/api/jobs/items?jobId=${jobId}`);
    const data = await res.json();
    if (data.ok) setItems(data.items || []);
  }

  // Poll items while active job is set
  useEffect(() => {
    if (!activeJobId) return;
    const t = setInterval(() => refreshItems(activeJobId), 2000);
    return () => clearInterval(t);
  }, [activeJobId]);

  useEffect(() => {
    refreshJobs();
  }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/(auth)/login";
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>InvoiceMe Dashboard</h1>

      <div style={{ marginBottom: 10 }}>
        <b>Logged in:</b> {user?.email}
        <button onClick={logout} style={{ marginLeft: 12 }}>
          Logout
        </button>
      </div>

      <hr />

      <h2>Step 1 — Save Drive Folder IDs</h2>
      <p>
        Raw folder = where scanned PDFs live<br />
        Docs folder = output root folder (we will create docs/&lt;MM-DD-YYYY&gt;/Invoice|Memo/)
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input
          style={{ width: "45%", padding: 10 }}
          placeholder="RAW folder ID"
          value={rawFolderId}
          onChange={(e) => setRawFolderId(e.target.value)}
        />
        <input
          style={{ width: "45%", padding: 10 }}
          placeholder="DOCS folder ID"
          value={docsFolderId}
          onChange={(e) => setDocsFolderId(e.target.value)}
        />
        <button onClick={saveFolders} style={{ padding: 10 }}>
          Save
        </button>
      </div>

      <hr />

      <h2>Step 2 — Run Organizer</h2>
      <button onClick={startJob} style={{ padding: 10, cursor: "pointer" }}>
        Start Job
      </button>

      <p style={{ marginTop: 10 }}>{msg}</p>

      <hr />

      <h2>Jobs</h2>
      <button onClick={refreshJobs} style={{ marginBottom: 10 }}>
        Refresh Jobs
      </button>

      <ul>
        {jobs.map((j) => (
          <li key={j.id} style={{ marginBottom: 6 }}>
            <button
              onClick={() => {
                setActiveJobId(j.id);
                refreshItems(j.id);
              }}
            >
              View
            </button>{" "}
            <b>{j.status}</b> | {j.id} | {new Date(j.created_at).toLocaleString()} | {j.message}
          </li>
        ))}
      </ul>

      <hr />

      <h2>Job Items (Live Extracted Data)</h2>
      <p>
        Active Job: <b>{activeJobId || "None"}</b>
      </p>

      <div style={{ overflowX: "auto" }}>
        <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Status</th>
              <th>File</th>
              <th>Type</th>
              <th>Date</th>
              <th>Company</th>
              <th>Doc #</th>
              <th>Output Path</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.status}</td>
                <td>{it.source_filename}</td>
                <td>{it.doc_type}</td>
                <td>{it.extracted_date}</td>
                <td>{it.extracted_company}</td>
                <td>{it.doc_number}</td>
                <td>{it.output_path}</td>
                <td style={{ color: "red" }}>{it.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
