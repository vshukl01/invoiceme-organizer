"""
processor.py

Core pipeline for one job:

Input:
- raw_folder_id (Drive folder)
- docs_folder_id (Drive folder root)

Output (Drive path):
docs/<MM-DD-YYYY>/<Invoice|Memo>/<CompanyName>_<DocNum>.pdf

Pipeline per PDF:
1) Download PDF
2) OCRmyPDF -> searchable PDF
3) Extract text from searchable PDF
4) Determine type (Invoice/Memo)
5) Strictly extract date + company + doc number
6) Create folder structure on Drive
7) Upload searchable PDF
8) Write job_items row for UI
"""

import os
import subprocess
import tempfile
import uuid
from datetime import datetime

from supabase import create_client

from .logger import get_logger
from .settings import settings
from .drive_client import get_drive_service, list_pdfs_in_folder, download_file, ensure_folder, upload_pdf
from .extract import (
    read_text,
    determine_doc_type,
    extract_invoice_date,
    extract_memo_date,
    extract_bill_to_company,
    extract_consignee_company,
    extract_doc_number,
)
from .normalize import safe_company_name

logger = get_logger(__name__)


def _ocr_to_searchable(in_pdf: str, out_pdf: str) -> None:
    """
    Uses OCRmyPDF to make PDF searchable.

    --skip-text ensures OCR runs only if needed.
    """
    cmd = ["ocrmypdf", "--skip-text", "--output-type", "pdf", in_pdf, out_pdf]
    logger.info(f"OCR START | {os.path.basename(in_pdf)}")
    subprocess.run(cmd, check=True)
    logger.info(f"OCR DONE  | {os.path.basename(out_pdf)}")


def _fallback_docnum(prefix: str) -> str:
    """
    If doc number missing from PDF, generate one so output filenames remain unique.
    """
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"


def run_job(job_id: str) -> None:
    """
    Executes a job by reading job row from Supabase.
    Writes progress + results into Supabase tables.
    """
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    drive = get_drive_service(settings.GOOGLE_SERVICE_ACCOUNT_JSON)

    job = supabase.table("jobs").select("*").eq("id", job_id).single().execute().data
    raw_folder_id = job.get("raw_folder_id")
    docs_folder_id = job.get("docs_folder_id")

    if not raw_folder_id or not docs_folder_id:
        raise ValueError("Job missing raw_folder_id/docs_folder_id")

    logger.info("=" * 70)
    logger.info(f"JOB START | job_id={job_id}")
    logger.info(f"RAW  folder_id={raw_folder_id}")
    logger.info(f"DOCS folder_id={docs_folder_id}")
    logger.info("=" * 70)

    # Mark running
    supabase.table("jobs").update(
        {"status": "running", "started_at": datetime.utcnow().isoformat(), "message": "Running"}
    ).eq("id", job_id).execute()

    pdfs = list_pdfs_in_folder(drive, raw_folder_id)

    # Process each PDF
    for idx, f in enumerate(pdfs, start=1):
        file_id = f["id"]
        src_name = f.get("name", "unknown.pdf")

        logger.info("\n" + "-" * 70)
        logger.info(f"FILE {idx}/{len(pdfs)} | name={src_name} | id={file_id}")
        logger.info("-" * 70)

        with tempfile.TemporaryDirectory() as td:
            src_path = os.path.join(td, "source.pdf")
            ocr_path = os.path.join(td, "searchable.pdf")

            try:
                # 1) Download
                download_file(drive, file_id, src_path)
                logger.info(f"Downloaded size={os.path.getsize(src_path)} bytes")

                # 2) OCR -> searchable
                _ocr_to_searchable(src_path, ocr_path)
                logger.info(f"Searchable size={os.path.getsize(ocr_path)} bytes")

                # 3) Extract text
                text = read_text(ocr_path)

                # 4) Determine doc type
                doc_type = determine_doc_type(text)

                # 5) Strict extraction
                if doc_type == "Invoice":
                    extracted_date = extract_invoice_date(text)     # ONLY Invoice Date
                    extracted_company = extract_bill_to_company(text)  # ONLY Bill To
                    docnum = extract_doc_number(text, "Invoice") or _fallback_docnum("SG/")
                else:
                    extracted_date = extract_memo_date(text)        # ONLY Memo Date
                    extracted_company = extract_consignee_company(text)  # ONLY Consignee
                    docnum = extract_doc_number(text, "Memo") or _fallback_docnum("M/")

                # Log extracted values clearly
                logger.info("EXTRACTED DATA:")
                logger.info(f"  type   = {doc_type}")
                logger.info(f"  date   = {extracted_date}")
                logger.info(f"  company= {extracted_company}")
                logger.info(f"  docnum = {docnum}")

                # 6) Create Drive folders docs/<date>/<type>
                date_folder_id = ensure_folder(drive, docs_folder_id, extracted_date)
                type_folder_id = ensure_folder(drive, date_folder_id, doc_type)

                safe_company = safe_company_name(extracted_company)
                out_filename = f"{safe_company}_{docnum.replace('/', '-')}.pdf"
                out_path = f"docs/{extracted_date}/{doc_type}/{out_filename}"

                logger.info(f"OUTPUT PATH: {out_path}")

                # 7) Upload searchable PDF
                out_file_id = upload_pdf(drive, type_folder_id, out_filename, ocr_path)

                # 8) Insert job item row for UI
                supabase.table("job_items").insert(
                    {
                        "job_id": job_id,
                        "source_file_id": file_id,
                        "source_filename": src_name,
                        "doc_type": doc_type,
                        "extracted_date": extracted_date,
                        "extracted_company": extracted_company,
                        "doc_number": docnum,
                        "output_file_id": out_file_id,
                        "output_path": out_path,
                        "status": "processed",
                    }
                ).execute()

                logger.info(f"FILE DONE | output_file_id={out_file_id}")

            except Exception as e:
                logger.exception(f"FILE FAILED | name={src_name} | error={e}")

                supabase.table("job_items").insert(
                    {
                        "job_id": job_id,
                        "source_file_id": file_id,
                        "source_filename": src_name,
                        "status": "failed",
                        "error": str(e),
                    }
                ).execute()

    # Job complete
    supabase.table("jobs").update(
        {
            "status": "done",
            "finished_at": datetime.utcnow().isoformat(),
            "message": f"Completed. Processed {len(pdfs)} PDFs.",
        }
    ).eq("id", job_id).execute()

    logger.info("=" * 70)
    logger.info(f"JOB DONE | job_id={job_id}")
    logger.info("=" * 70)
