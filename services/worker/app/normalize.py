"""
normalize.py

Normalizes company names for safe filenames:
- removes accents/unicode
- strips punctuation
- removes spaces
"""

import re
import unicodedata


def safe_company_name(name: str) -> str:
    s = (name or "").strip()

    # Convert accented/unicode to ASCII
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")

    # Collapse spaces
    s = re.sub(r"\s+", " ", s)

    # Remove unsafe filename characters
    s = re.sub(r"[^A-Za-z0-9 _-]+", "", s).strip()

    # Remove spaces for filename
    s = s.replace(" ", "")

    return s[:60] if s else "UnknownCompany"
