"""
drive_client.py

Google Drive operations via Service Account:

- list PDFs in a folder
- download a file
- ensure folder path exists
- upload a PDF into a folder

IMPORTANT:
Service Account only has access to folders/files explicitly shared with it.
"""

import io
import json
from typing import Dict, List, Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload

from .logger import get_logger

logger = get_logger(__name__)
SCOPES = ["https://www.googleapis.com/auth/drive"]


def get_drive_service(service_account_json: str):
    info = json.loads(service_account_json)
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def list_pdfs_in_folder(drive, folder_id: str) -> List[Dict]:
    q = f"'{folder_id}' in parents and mimeType='application/pdf' and trashed=false"
    res = drive.files().list(q=q, fields="files(id,name,createdTime)").execute()
    files = res.get("files", [])
    logger.info(f"Drive list | folder_id={folder_id} pdf_count={len(files)}")
    return files


def download_file(drive, file_id: str, out_path: str) -> None:
    logger.info(f"Drive download START | file_id={file_id} -> {out_path}")
    request = drive.files().get_media(fileId=file_id)
    fh = io.FileIO(out_path, "wb")
    downloader = MediaIoBaseDownload(fh, request)

    done = False
    while not done:
        _, done = downloader.next_chunk()

    logger.info(f"Drive download DONE  | file_id={file_id}")


def upload_pdf(drive, parent_folder_id: str, filename: str, local_path: str) -> str:
    logger.info(f"Drive upload START | {local_path} -> folder={parent_folder_id} name={filename}")
    media = MediaFileUpload(local_path, mimetype="application/pdf", resumable=True)
    meta = {"name": filename, "parents": [parent_folder_id]}
    created = drive.files().create(body=meta, media_body=media, fields="id").execute()
    logger.info(f"Drive upload DONE  | out_file_id={created['id']}")
    return created["id"]


def find_child_folder(drive, parent_id: str, folder_name: str) -> Optional[str]:
    safe_name = folder_name.replace("'", "\\'")
    q = (
        f"'{parent_id}' in parents and "
        f"mimeType='application/vnd.google-apps.folder' and "
        f"name='{safe_name}' and trashed=false"
    )
    res = drive.files().list(q=q, fields="files(id,name)").execute()
    files = res.get("files", [])
    return files[0]["id"] if files else None


def ensure_folder(drive, parent_id: str, folder_name: str) -> str:
    """
    Returns folder_id for parent/folder_name.
    Creates folder if it does not exist.
    """
    existing = find_child_folder(drive, parent_id, folder_name)
    if existing:
        return existing

    logger.info(f"Drive mkdir | parent={parent_id} name={folder_name}")
    meta = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_id],
    }
    created = drive.files().create(body=meta, fields="id").execute()
    return created["id"]
