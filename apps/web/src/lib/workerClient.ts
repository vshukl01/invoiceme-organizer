// apps/web/src/lib/workerClient.ts
import "server-only";

/**
 * workerClient.ts
 * Calls your FastAPI worker (Render).
 * - Uses WORKER_BASE_URL
 * - Sends x-worker-token header
 */

import { env } from "@/lib/env";

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
