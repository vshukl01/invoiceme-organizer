"""
main.py

FastAPI worker service.

Endpoints:
- GET /health
- POST /enqueue  (runs a job)

For now, enqueue runs synchronously (simple, debuggable).
Later: we can add a queue + background workers.
"""

from datetime import datetime
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from supabase import create_client

from .logger import get_logger
from .settings import settings
from .processor import run_job

logger = get_logger(__name__)
app = FastAPI()


class EnqueueRequest(BaseModel):
    job_id: str


@app.get("/health")
def health():
    return {"ok": True, "service": "InvoiceMe Worker"}


@app.post("/enqueue")
def enqueue(req: EnqueueRequest, x_worker_token: str = Header(default="")):
    # simple auth between UI server and worker
    if x_worker_token != settings.WORKER_API_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

    logger.info(f"ENQUEUE | job_id={req.job_id}")

    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Mark queued
    supabase.table("jobs").update({"status": "queued", "message": "Enqueued"}).eq("id", req.job_id).execute()

    try:
        run_job(req.job_id)
        return {"ok": True, "job_id": req.job_id}
    except Exception as e:
        logger.exception(f"JOB FAILED | job_id={req.job_id} | error={e}")
        supabase.table("jobs").update(
            {
                "status": "failed",
                "finished_at": datetime.utcnow().isoformat(),
                "message": str(e),
            }
        ).eq("id", req.job_id).execute()
        raise HTTPException(status_code=500, detail=str(e))
