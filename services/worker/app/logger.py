"""
logger.py

Central logging for the worker.

- Logs are printed to stdout (so you see them in terminal and in production logs).
- Each module imports get_logger(__name__) to log with its module name.

This is designed so when the script runs, it clearly shows:
- what file is being processed
- which step (download, OCR, extract, folder create, upload)
- extracted fields for every doc
"""

import logging
import os

_configured = False


def get_logger(name: str) -> logging.Logger:
    global _configured
    if not _configured:
        level = os.getenv("LOG_LEVEL", "INFO").upper()
        logging.basicConfig(
            level=getattr(logging, level, logging.INFO),
            format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        )
        _configured = True
    return logging.getLogger(name)
