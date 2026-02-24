from datetime import date
from typing import Optional, Tuple, List

from sqlalchemy.orm import Session, joinedload

from app.models.extraction import Extraction
from app.schemas.extraction import ExtractionCreate, ExtractionUpdate


def _base_query(db: Session):
    return db.query(Extraction).options(joinedload(Extraction.operator))


def get_extractions(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    specimen_code: Optional[str] = None,
    extraction_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> Tuple[List[Extraction], int]:
    q = _base_query(db)
    if specimen_code:
        q = q.filter(Extraction.specimen_code.ilike(f"%{specimen_code}%"))
    if extraction_type:
        q = q.filter(Extraction.extraction_type == extraction_type)
    if date_from:
        q = q.filter(Extraction.date >= date_from)
    if date_to:
        q = q.filter(Extraction.date <= date_to)
    total = q.count()
    items = q.order_by(Extraction.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_extraction(db: Session, extraction_id: int) -> Optional[Extraction]:
    return _base_query(db).filter(Extraction.id == extraction_id).first()


def create_extraction(db: Session, data: ExtractionCreate) -> Extraction:
    obj = Extraction(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return get_extraction(db, obj.id)


def update_extraction(db: Session, obj: Extraction, data: ExtractionUpdate) -> Extraction:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return get_extraction(db, obj.id)


def delete_extraction(db: Session, obj: Extraction) -> None:
    db.delete(obj)
    db.commit()
