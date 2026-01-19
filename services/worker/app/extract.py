"""
extract.py

STRICT extraction rules you specified:

- Date must come ONLY from:
  - Invoice Date (never Due Date)
  - Memo Date

- Company must come ONLY from:
  - Bill To (invoice)
  - Consignee (memo)

- Doc numbers:
  - Invoice doc numbers start with SG/
  - Memo doc numbers start with M/

This module extracts from text. We OCR first (OCRmyPDF) so text exists.
"""

import re
from datetime import datetime
from typing import Optional

from pypdf import PdfReader


def read_text(pdf_path: str) -> str:
    """
    Extracts text from a searchable PDF.
    (OCRmyPDF should have run before this.)
    """
    reader = PdfReader(pdf_path)
    parts = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n".join(parts)


# Accept common date formats and normalize to MM-DD-YYYY
DATE_FORMATS = ["%m/%d/%Y", "%m-%d-%Y", "%B %d, %Y", "%b %d, %Y"]


def normalize_date(date_str: str) -> str:
    s = (date_str or "").strip()
    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%m-%d-%Y")
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: '{s}'")


def determine_doc_type(text: str) -> str:
    """
    Determines doc type based on the presence of key labels.
    """
    has_invoice_date = re.search(r"\bInvoice\s*Date\b", text, flags=re.IGNORECASE)
    has_memo_date = re.search(r"\bMemo\s*Date\b", text, flags=re.IGNORECASE)

    if has_invoice_date and not has_memo_date:
        return "Invoice"
    if has_memo_date and not has_invoice_date:
        return "Memo"

    if has_invoice_date:
        return "Invoice"
    if has_memo_date:
        return "Memo"

    raise ValueError("Missing required label: Invoice Date or Memo Date")


def _extract_label_line(text: str, label_regex: str) -> str:
    """
    Finds a label and grabs the value on the same line.
    Example: 'Invoice Date: 01/19/2026'
    """
    m = re.search(label_regex, text, flags=re.IGNORECASE)
    if not m:
        raise ValueError(f"Label not found: {label_regex}")
    raw = m.group(1).splitlines()[0].strip()
    return raw


def extract_invoice_date(text: str) -> str:
    raw = _extract_label_line(text, r"\bInvoice\s*Date\b\s*[:\-]?\s*(.+)")
    return normalize_date(raw)


def extract_memo_date(text: str) -> str:
    raw = _extract_label_line(text, r"\bMemo\s*Date\b\s*[:\-]?\s*(.+)")
    return normalize_date(raw)


def _first_non_empty_line(lines: list[str]) -> str:
    for line in lines:
        s = line.strip()
        if s:
            return s
    raise ValueError("Company name line not found under label")


def extract_bill_to_company(text: str) -> str:
    """
    STRICT: company comes from Bill To section.
    We find 'Bill To' and take the next non-empty line.
    """
    m = re.search(r"\bBill\s*To\b", text, flags=re.IGNORECASE)
    if not m:
        raise ValueError("Bill To not found")
    after = text[m.end():].splitlines()
    return _first_non_empty_line(after)


def extract_consignee_company(text: str) -> str:
    """
    STRICT: company comes from Consignee section.
    We find 'Consignee' and take the next non-empty line.
    """
    m = re.search(r"\bConsignee\b", text, flags=re.IGNORECASE)
    if not m:
        raise ValueError("Consignee not found")
    after = text[m.end():].splitlines()
    return _first_non_empty_line(after)


def extract_doc_number(text: str, doc_type: str) -> Optional[str]:
    """
    Finds first matching doc number token.
    - Invoice: SG/<something>
    - Memo: M/<something>
    """
    if doc_type == "Invoice":
        m = re.search(r"\bSG/\s*([A-Za-z0-9_-]+)\b", text, flags=re.IGNORECASE)
        return f"SG/{m.group(1)}" if m else None

    if doc_type == "Memo":
        m = re.search(r"\bM/\s*([A-Za-z0-9_-]+)\b", text, flags=re.IGNORECASE)
        return f"M/{m.group(1)}" if m else None

    return None
