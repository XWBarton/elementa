import mimetypes
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.dependencies import get_current_user, get_db
from app.models.run_attachment import RunAttachment
from app.models.user import User

ATTACHMENT_DIR = Path("/data/attachments")
VALID_RUN_TYPES = {"extraction", "pcr", "sanger", "library_prep", "ngs"}
ATTACHMENT_ALLOWED = {".pdf", ".xlsx", ".xls", ".csv", ".txt", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".docx", ".doc", ".zip"}
MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

router = APIRouter(prefix="/attachments", tags=["attachments"])


class AttachmentRead(BaseModel):
    id: int
    run_type: str
    run_id: int
    filename: str
    original_filename: str
    mime_type: str | None = None
    caption: str | None = None
    uploaded_by_id: int | None = None
    uploaded_at: str

    class Config:
        from_attributes = True


def _read(obj: RunAttachment) -> dict:
    return {
        "id": obj.id,
        "run_type": obj.run_type,
        "run_id": obj.run_id,
        "filename": obj.filename,
        "original_filename": obj.original_filename,
        "mime_type": obj.mime_type,
        "caption": obj.caption,
        "uploaded_by_id": obj.uploaded_by_id,
        "uploaded_at": obj.uploaded_at.isoformat(),
    }


@router.get("/{run_type}/{run_id}")
def list_attachments(
    run_type: str,
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if run_type not in VALID_RUN_TYPES:
        raise HTTPException(status_code=400, detail="Invalid run type")
    items = (
        db.query(RunAttachment)
        .filter(RunAttachment.run_type == run_type, RunAttachment.run_id == run_id)
        .order_by(RunAttachment.uploaded_at)
        .all()
    )
    return [_read(i) for i in items]


@router.post("/{run_type}/{run_id}")
async def upload_attachment(
    run_type: str,
    run_id: int,
    file: UploadFile = File(...),
    caption: str = Form(default=""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if run_type not in VALID_RUN_TYPES:
        raise HTTPException(status_code=400, detail="Invalid run type")
    ATTACHMENT_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "file").suffix.lower()
    if ext not in ATTACHMENT_ALLOWED:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Accepted: {', '.join(sorted(ATTACHMENT_ALLOWED))}",
        )
    contents = await file.read()
    if len(contents) > MAX_ATTACHMENT_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_ATTACHMENT_SIZE_BYTES // (1024 * 1024)} MB",
        )
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = ATTACHMENT_DIR / stored_name
    dest.write_bytes(contents)
    mime = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    record = RunAttachment(
        run_type=run_type,
        run_id=run_id,
        filename=stored_name,
        original_filename=file.filename or stored_name,
        mime_type=mime,
        caption=caption or None,
        uploaded_by_id=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _read(record)


@router.get("/{run_type}/{run_id}/{attachment_id}/file")
def get_file(
    run_type: str,
    run_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    record = db.query(RunAttachment).filter(
        RunAttachment.id == attachment_id,
        RunAttachment.run_type == run_type,
        RunAttachment.run_id == run_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attachment not found")
    path = ATTACHMENT_DIR / record.filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing")
    return FileResponse(str(path), media_type=record.mime_type or "application/octet-stream",
                        filename=record.original_filename)


@router.delete("/{run_type}/{run_id}/{attachment_id}")
def delete_attachment(
    run_type: str,
    run_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(RunAttachment).filter(
        RunAttachment.id == attachment_id,
        RunAttachment.run_type == run_type,
        RunAttachment.run_id == run_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attachment not found")
    if record.uploaded_by_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorised")
    path = ATTACHMENT_DIR / record.filename
    if path.exists():
        path.unlink()
    db.delete(record)
    db.commit()
    return {"detail": "Deleted"}
