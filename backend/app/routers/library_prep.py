from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.library_prep import (
    create_library_prep, delete_library_prep, get_library_prep, get_library_preps, update_library_prep,
)
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.library_prep import LibraryPrepCreate, LibraryPrepRead, LibraryPrepUpdate

router = APIRouter(prefix="/library-preps", tags=["library_prep"])


@router.get("/", response_model=dict)
def list_preps(
    skip: int = 0,
    limit: int = 50,
    extraction_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    items, total = get_library_preps(db, skip=skip, limit=limit, extraction_id=extraction_id)
    return {"items": [LibraryPrepRead.model_validate(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=LibraryPrepRead)
def create(data: LibraryPrepCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return create_library_prep(db, data)


@router.get("/{prep_id}", response_model=LibraryPrepRead)
def read_prep(prep_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_library_prep(db, prep_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Library prep not found")
    return obj


@router.put("/{prep_id}", response_model=LibraryPrepRead)
def update(prep_id: int, data: LibraryPrepUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = get_library_prep(db, prep_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Library prep not found")
    return update_library_prep(db, obj, data)


@router.delete("/{prep_id}")
def delete(prep_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = get_library_prep(db, prep_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Library prep not found")
    delete_library_prep(db, obj)
    return {"detail": "Deleted"}
