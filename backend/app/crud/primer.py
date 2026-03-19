from sqlalchemy.orm import Session
from app.models.primer import Primer
from app.schemas.primer import PrimerCreate, PrimerUpdate
from typing import List, Optional


def get_primers(db: Session, q: Optional[str] = None) -> List[Primer]:
    query = db.query(Primer)
    if q:
        like = f"%{q}%"
        query = query.filter(
            Primer.name.ilike(like) |
            Primer.target_taxa.ilike(like) |
            Primer.target_gene.ilike(like)
        )
    return query.order_by(Primer.name).all()


def get_primer(db: Session, primer_id: int) -> Optional[Primer]:
    return db.query(Primer).filter(Primer.id == primer_id).first()


def _set_pairs(db: Session, primer: Primer, pair_ids: List[int]) -> None:
    if pair_ids:
        primer.pairs = db.query(Primer).filter(Primer.id.in_(pair_ids)).all()
    else:
        primer.pairs = []


def create_primer(db: Session, data: PrimerCreate) -> Primer:
    fields = data.model_dump(exclude={'pair_ids'})
    primer = Primer(**fields)
    db.add(primer)
    db.flush()  # get the id before setting pairs
    _set_pairs(db, primer, data.pair_ids)
    db.commit()
    db.refresh(primer)
    return primer


def update_primer(db: Session, primer: Primer, data: PrimerUpdate) -> Primer:
    fields = data.model_dump(exclude_unset=True, exclude={'pair_ids'})
    for field, value in fields.items():
        setattr(primer, field, value)
    if data.pair_ids is not None:
        _set_pairs(db, primer, data.pair_ids)
    db.commit()
    db.refresh(primer)
    return primer


def delete_primer(db: Session, primer: Primer) -> None:
    db.delete(primer)
    db.commit()


def bulk_create_primers(db: Session, primers_data: List[PrimerCreate]) -> List[Primer]:
    primers = []
    for data in primers_data:
        fields = data.model_dump(exclude={'pair_ids'})
        primer = Primer(**fields)
        db.add(primer)
        primers.append((primer, data.pair_ids))
    db.flush()
    for primer, pair_ids in primers:
        _set_pairs(db, primer, pair_ids)
    db.commit()
    for primer, _ in primers:
        db.refresh(primer)
    return [p for p, _ in primers]
