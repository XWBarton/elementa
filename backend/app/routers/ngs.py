from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.ngs_run import (
    create_ngs_run, delete_ngs_run, get_ngs_run, get_ngs_runs, update_ngs_run,
)
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.ngs_run import NGSRunCreate, NGSRunRead, NGSRunUpdate

router = APIRouter(prefix="/ngs-runs", tags=["ngs"])


@router.get("/", response_model=dict)
def list_runs(
    skip: int = 0,
    limit: int = 50,
    platform: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    items, total = get_ngs_runs(db, skip=skip, limit=limit, platform=platform, date_from=date_from, date_to=date_to)
    return {"items": [NGSRunRead.model_validate(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=NGSRunRead)
def create(data: NGSRunCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return create_ngs_run(db, data)


@router.get("/{run_id}", response_model=NGSRunRead)
def read_run(run_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_ngs_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="NGS run not found")
    return obj


@router.put("/{run_id}", response_model=NGSRunRead)
def update(run_id: int, data: NGSRunUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_ngs_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="NGS run not found")
    return update_ngs_run(db, obj, data)


@router.delete("/{run_id}")
def delete(run_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = get_ngs_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="NGS run not found")
    delete_ngs_run(db, obj)
    return {"detail": "Deleted"}
