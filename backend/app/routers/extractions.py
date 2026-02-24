from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.extraction import (
    create_extraction, delete_extraction, get_extraction, get_extractions, update_extraction,
)
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.extraction import ExtractionCreate, ExtractionRead, ExtractionUpdate

router = APIRouter(prefix="/extractions", tags=["extractions"])


@router.get("/", response_model=dict)
def list_extractions(
    skip: int = 0,
    limit: int = 50,
    specimen_code: Optional[str] = None,
    extraction_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    items, total = get_extractions(db, skip=skip, limit=limit, specimen_code=specimen_code,
                                   extraction_type=extraction_type, date_from=date_from, date_to=date_to)
    return {"items": [ExtractionRead.model_validate(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=ExtractionRead)
def create(data: ExtractionCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return create_extraction(db, data)


@router.get("/{extraction_id}", response_model=ExtractionRead)
def read_extraction(extraction_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_extraction(db, extraction_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Extraction not found")
    return obj


@router.put("/{extraction_id}", response_model=ExtractionRead)
def update(extraction_id: int, data: ExtractionUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_extraction(db, extraction_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Extraction not found")
    return update_extraction(db, obj, data)


@router.delete("/{extraction_id}")
def delete(extraction_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = get_extraction(db, extraction_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Extraction not found")
    delete_extraction(db, obj)
    return {"detail": "Deleted"}
