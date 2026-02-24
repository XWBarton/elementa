from typing import Optional, Tuple, List

from sqlalchemy.orm import Session, joinedload

from app.models.pcr_reaction import PCRReaction
from app.schemas.pcr_reaction import PCRCreate, PCRUpdate


def _base_query(db: Session):
    return db.query(PCRReaction).options(joinedload(PCRReaction.operator))


def get_pcr_reactions(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    extraction_id: Optional[int] = None,
) -> Tuple[List[PCRReaction], int]:
    q = _base_query(db)
    if extraction_id is not None:
        q = q.filter(PCRReaction.extraction_id == extraction_id)
    total = q.count()
    items = q.order_by(PCRReaction.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_pcr_reaction(db: Session, pcr_id: int) -> Optional[PCRReaction]:
    return _base_query(db).filter(PCRReaction.id == pcr_id).first()


def create_pcr_reaction(db: Session, data: PCRCreate) -> PCRReaction:
    obj = PCRReaction(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return get_pcr_reaction(db, obj.id)


def update_pcr_reaction(db: Session, obj: PCRReaction, data: PCRUpdate) -> PCRReaction:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return get_pcr_reaction(db, obj.id)


def delete_pcr_reaction(db: Session, obj: PCRReaction) -> None:
    db.delete(obj)
    db.commit()
