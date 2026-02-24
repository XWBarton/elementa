from typing import Optional, Tuple, List

from sqlalchemy.orm import Session, joinedload

from app.models.library_prep import LibraryPrep
from app.schemas.library_prep import LibraryPrepCreate, LibraryPrepUpdate


def _base_query(db: Session):
    return db.query(LibraryPrep).options(joinedload(LibraryPrep.operator))


def get_library_preps(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    extraction_id: Optional[int] = None,
) -> Tuple[List[LibraryPrep], int]:
    q = _base_query(db)
    if extraction_id is not None:
        q = q.filter(LibraryPrep.extraction_id == extraction_id)
    total = q.count()
    items = q.order_by(LibraryPrep.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_library_prep(db: Session, prep_id: int) -> Optional[LibraryPrep]:
    return _base_query(db).filter(LibraryPrep.id == prep_id).first()


def create_library_prep(db: Session, data: LibraryPrepCreate) -> LibraryPrep:
    obj = LibraryPrep(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return get_library_prep(db, obj.id)


def update_library_prep(db: Session, obj: LibraryPrep, data: LibraryPrepUpdate) -> LibraryPrep:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return get_library_prep(db, obj.id)


def delete_library_prep(db: Session, obj: LibraryPrep) -> None:
    db.delete(obj)
    db.commit()
