from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.crud.primer import (
    get_primers, get_primer, create_primer, update_primer, delete_primer, bulk_create_primers,
    get_primer_pairs, get_primer_pair, create_primer_pair, update_primer_pair, delete_primer_pair,
)
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.primer import (
    PrimerCreate, PrimerRead, PrimerUpdate,
    PrimerPairCreate, PrimerPairRead, PrimerPairUpdate,
)

router = APIRouter(tags=["primers"])


# ── Primers ───────────────────────────────────────────────────────

@router.get("/primers/", response_model=List[PrimerRead])
def list_primers(q: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_primers(db, q=q)


@router.post("/primers/", response_model=PrimerRead)
def create(data: PrimerCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    try:
        return create_primer(db, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"A primer named '{data.name}' already exists")


@router.post("/primers/bulk", response_model=List[PrimerRead])
def bulk_create(data: List[PrimerCreate], db: Session = Depends(get_db), _=Depends(get_current_user)):
    if not data:
        raise HTTPException(status_code=400, detail="No primers provided")
    try:
        return bulk_create_primers(db, data)
    except IntegrityError as e:
        db.rollback()
        msg = str(e.orig) if e.orig else str(e)
        raise HTTPException(status_code=400, detail=f"Duplicate primer name in import — check for names that already exist in the library. Detail: {msg}")


@router.get("/primers/{primer_id}", response_model=PrimerRead)
def get_one(primer_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    primer = get_primer(db, primer_id)
    if not primer:
        raise HTTPException(status_code=404, detail="Primer not found")
    return primer


@router.put("/primers/{primer_id}", response_model=PrimerRead)
def update(primer_id: int, data: PrimerUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    primer = get_primer(db, primer_id)
    if not primer:
        raise HTTPException(status_code=404, detail="Primer not found")
    return update_primer(db, primer, data)


@router.delete("/primers/{primer_id}")
def delete(primer_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    primer = get_primer(db, primer_id)
    if not primer:
        raise HTTPException(status_code=404, detail="Primer not found")
    delete_primer(db, primer)
    return {"detail": "Deleted"}


# ── Primer Pairs ──────────────────────────────────────────────────

@router.get("/primer-pairs/", response_model=List[PrimerPairRead])
def list_primer_pairs(q: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_primer_pairs(db, q=q)


@router.post("/primer-pairs/", response_model=PrimerPairRead)
def create_pair(data: PrimerPairCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return create_primer_pair(db, data)


@router.get("/primer-pairs/{pair_id}", response_model=PrimerPairRead)
def get_one_pair(pair_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    pair = get_primer_pair(db, pair_id)
    if not pair:
        raise HTTPException(status_code=404, detail="Primer pair not found")
    return pair


@router.put("/primer-pairs/{pair_id}", response_model=PrimerPairRead)
def update_pair(pair_id: int, data: PrimerPairUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    pair = get_primer_pair(db, pair_id)
    if not pair:
        raise HTTPException(status_code=404, detail="Primer pair not found")
    return update_primer_pair(db, pair, data)


@router.delete("/primer-pairs/{pair_id}")
def delete_pair(pair_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    pair = get_primer_pair(db, pair_id)
    if not pair:
        raise HTTPException(status_code=404, detail="Primer pair not found")
    delete_primer_pair(db, pair)
    return {"detail": "Deleted"}
