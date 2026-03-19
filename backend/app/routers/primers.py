from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.crud.primer import get_primers, get_primer, create_primer, update_primer, delete_primer, bulk_create_primers
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.primer import PrimerCreate, PrimerRead, PrimerUpdate

router = APIRouter(prefix="/primers", tags=["primers"])


@router.get("/", response_model=List[PrimerRead])
def list_primers(q: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_primers(db, q=q)


@router.post("/", response_model=PrimerRead)
def create(data: PrimerCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    try:
        return create_primer(db, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"A primer named '{data.name}' already exists")


@router.post("/bulk", response_model=List[PrimerRead])
def bulk_create(data: List[PrimerCreate], db: Session = Depends(get_db), _=Depends(get_current_user)):
    if not data:
        raise HTTPException(status_code=400, detail="No primers provided")
    try:
        return bulk_create_primers(db, data)
    except IntegrityError as e:
        db.rollback()
        # Extract the duplicate name from the error if possible
        msg = str(e.orig) if e.orig else str(e)
        raise HTTPException(status_code=400, detail=f"Duplicate primer name in import — check for names that already exist in the library. Detail: {msg}")


@router.get("/{primer_id}", response_model=PrimerRead)
def get_one(primer_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    primer = get_primer(db, primer_id)
    if not primer:
        raise HTTPException(status_code=404, detail="Primer not found")
    return primer


@router.put("/{primer_id}", response_model=PrimerRead)
def update(primer_id: int, data: PrimerUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    primer = get_primer(db, primer_id)
    if not primer:
        raise HTTPException(status_code=404, detail="Primer not found")
    return update_primer(db, primer, data)


@router.delete("/{primer_id}")
def delete(primer_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    primer = get_primer(db, primer_id)
    if not primer:
        raise HTTPException(status_code=404, detail="Primer not found")
    delete_primer(db, primer)
    return {"detail": "Deleted"}
