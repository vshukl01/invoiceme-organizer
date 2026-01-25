import { env } from "@/lib/env.server";


export async function enqueueJob(payload: { jobId: string }) {
  const res = await fetch(`${env.WORKER_BASE_URL}/enqueue`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-worker-token": env.WORKER_API_TOKEN,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || "Worker enqueue failed");
  }

  return data;
}
