"""
Receipt upload — stored on local disk (backend/uploads/receipts/), served
via a static file mount. No external storage service.
"""
import os
import uuid as uuid_lib
from pathlib import Path

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "receipts"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}
_MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


class InvalidReceiptError(Exception):
    """Raised when an uploaded file fails type/size validation."""


def save_receipt(filename: str, content_type: str, contents: bytes) -> str:
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise InvalidReceiptError("Only images (JPEG/PNG/WEBP/GIF) or PDF files are allowed")
    if len(contents) > _MAX_SIZE_BYTES:
        raise InvalidReceiptError("File too large — max 5MB")
    ext = os.path.splitext(filename or "")[1] or ".bin"
    stored_name = f"{uuid_lib.uuid4()}{ext}"
    (UPLOAD_DIR / stored_name).write_bytes(contents)
    return f"/uploads/receipts/{stored_name}"


def delete_receipt_file(receipt_url: str) -> None:
    if not receipt_url:
        return
    stored_name = receipt_url.rsplit("/", 1)[-1]
    path = UPLOAD_DIR / stored_name
    if path.exists():
        path.unlink()
