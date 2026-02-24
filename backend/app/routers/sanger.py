from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.sanger_run import (
    create_sanger_run, delete_sanger_run, get_sanger_run, get_sanger_runs, update_sanger_run,
)
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.sanger_run import SangerCreate, SangerRead, SangerUpdate

router = APIRouter(prefix="/sanger", tags=["sanger"])


@router.get("/", response_model=dict)
def list_sanger(
    skip: int = 0,
    limit: int = 50,
    pcr_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    items, total = get_sanger_runs(db, skip=skip, limit=limit, pcr_id=pcr_id)
    return {"items": [SangerRead.model_validate(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=SangerRead)
def create(data: SangerCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return create_sanger_run(db, data)


@router.get("/{sanger_id}", response_model=SangerRead)
def read_sanger(sanger_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_sanger_run(db, sanger_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sanger run not found")
    return obj


@router.put("/{sanger_id}", response_model=SangerRead)
def update(sanger_id: int, data: SangerUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_sanger_run(db, sanger_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sanger run not found")
    return update_sanger_run(db, obj, data)


@router.delete("/{sanger_id}")
def delete(sanger_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = get_sanger_run(db, sanger_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sanger run not found")
    delete_sanger_run(db, obj)
    return {"detail": "Deleted"}
