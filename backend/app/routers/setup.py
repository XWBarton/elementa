from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.user import create_user, get_user_by_username
from app.dependencies import get_db
from app.models.user import User
from app.schemas.user import UserCreate

router = APIRouter(prefix="/setup", tags=["setup"])


class SetupPayload(BaseModel):
    full_name: str
    username: str
    email: str
    password: str


@router.get("/status")
def setup_status(db: Session = Depends(get_db)):
    default_admin = get_user_by_username(db, settings.FIRST_ADMIN_USERNAME)
    needs_setup = default_admin is not None and default_admin.is_active
    return {"needs_setup": needs_setup}


@router.post("/complete")
def complete_setup(data: SetupPayload, db: Session = Depends(get_db)):
    default_admin = get_user_by_username(db, settings.FIRST_ADMIN_USERNAME)
    if not default_admin or not default_admin.is_active:
        raise HTTPException(status_code=400, detail="Setup already complete")
    if get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    create_user(db, UserCreate(
        username=data.username,
        full_name=data.full_name,
        email=data.email,
        password=data.password,
        is_admin=True,
    ))
    db.delete(default_admin)
    db.commit()
    return {"ok": True}
