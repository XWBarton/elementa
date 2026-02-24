from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.user import create_user, delete_user, hard_delete_user, get_user, get_users, update_user
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


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


@router.delete("/{user_id}/hard")
def hard_delete(user_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    hard_delete_user(db, user)
    return {"ok": True}
