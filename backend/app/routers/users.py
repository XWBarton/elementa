import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.crud.user import create_user, delete_user, hard_delete_user, get_user, get_users, update_user
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

AVATAR_DIR = Path("/data/avatars")
AVATAR_ALLOWED = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.get("/", response_model=dict)
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _=Depends(require_admin)):
    items, total = get_users(db, skip=skip, limit=limit)
    return {"items": [UserRead.model_validate(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=UserRead)
def create(data: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return create_user(db, data)


@router.get("/{user_id}", response_model=UserRead)
def read_user(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserRead)
def update(user_id: int, data: UserUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return update_user(db, user, data)


@router.delete("/{user_id}", response_model=UserRead)
def deactivate(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return delete_user(db, user)


@router.post("/me/avatar", response_model=UserRead)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in AVATAR_ALLOWED:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Use: {', '.join(AVATAR_ALLOWED)}")
    content = file.file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    if current_user.avatar_filename:
        old = AVATAR_DIR / current_user.avatar_filename
        if old.exists():
            os.unlink(old)
    stored = f"{uuid.uuid4()}{ext}"
    (AVATAR_DIR / stored).write_bytes(content)
    current_user.avatar_filename = stored
    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.delete("/me/avatar", response_model=UserRead)
def delete_avatar(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.avatar_filename:
        old = AVATAR_DIR / current_user.avatar_filename
        if old.exists():
            os.unlink(old)
        current_user.avatar_filename = None
        db.commit()
        db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.get("/{user_id}/avatar")
def get_avatar(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = get_user(db, user_id)
    if not user or not user.avatar_filename:
        raise HTTPException(status_code=404, detail="No avatar")
    path = AVATAR_DIR / user.avatar_filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Avatar file not found")
    return FileResponse(str(path))


@router.delete("/{user_id}/hard")
def hard_delete(user_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    hard_delete_user(db, user)
    return {"ok": True}
