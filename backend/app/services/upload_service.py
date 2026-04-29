import base64
import binascii
import re
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, Request, status

from app.core.config import get_settings
from app.schemas.site import ImageUploadRequest, ImageUploadResponse

_EXTENSION_BY_CONTENT_TYPE = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
}

_SAFE_NAME_PATTERN = re.compile(r"[^a-zA-Z0-9._-]+")
_MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024


def store_uploaded_image(payload: ImageUploadRequest, request: Request) -> ImageUploadResponse:
    settings = get_settings()
    content_type = payload.content_type.lower().strip()

    if content_type not in _EXTENSION_BY_CONTENT_TYPE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")

    try:
        raw_bytes = base64.b64decode(payload.data_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image payload") from exc

    if not raw_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image payload is empty")

    if len(raw_bytes) > _MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image exceeds 8 MB limit")

    upload_dir = Path(settings.upload_dir).resolve()
    upload_dir.mkdir(parents=True, exist_ok=True)

    original_name = Path(payload.filename).stem or "image"
    safe_stem = _SAFE_NAME_PATTERN.sub("-", original_name).strip("._-") or "image"
    extension = _EXTENSION_BY_CONTENT_TYPE[content_type]
    file_name = f"{safe_stem}-{uuid4().hex[:10]}.{extension}"
    file_path = upload_dir / file_name
    file_path.write_bytes(raw_bytes)

    public_root = str(request.base_url).rstrip("/")
    public_path = settings.upload_url_path.rstrip("/")
    return ImageUploadResponse(url=f"{public_root}{public_path}/{file_name}", filename=file_name)
