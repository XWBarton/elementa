from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.pcr_reaction import (
    create_pcr_reaction, delete_pcr_reaction, get_pcr_reaction, get_pcr_reactions, update_pcr_reaction,
)
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.pcr_reaction import PCRCreate, PCRRead, PCRUpdate

router = APIRouter(prefix="/pcr", tags=["pcr"])


@router.get("/", response_model=dict)
def list_pcr(
    skip: int = 0,
    limit: int = 50,
    extraction_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    items, total = get_pcr_reactions(db, skip=skip, limit=limit, extraction_id=extraction_id)
    return {"items": [PCRRead.model_validate(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=PCRRead)
def create(data: PCRCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return create_pcr_reaction(db, data)


@router.get("/{pcr_id}", response_model=PCRRead)
def read_pcr(pcr_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_pcr_reaction(db, pcr_id)
    if not obj:
        raise HTTPException(status_code=404, detail="PCR reaction not found")
    return obj


@router.put("/{pcr_id}", response_model=PCRRead)
def update(pcr_id: int, data: PCRUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_pcr_reaction(db, pcr_id)
    if not obj:
        raise HTTPException(status_code=404, detail="PCR reaction not found")
    return update_pcr_reaction(db, obj, data)


@router.delete("/{pcr_id}")
def delete(pcr_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = get_pcr_reaction(db, pcr_id)
    if not obj:
        raise HTTPException(status_code=404, detail="PCR reaction not found")
    delete_pcr_reaction(db, obj)
    return {"detail": "Deleted"}
