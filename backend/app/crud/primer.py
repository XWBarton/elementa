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


def create_primer(db: Session, data: PrimerCreate) -> Primer:
    primer = Primer(**data.model_dump())
    db.add(primer)
    db.commit()
    db.refresh(primer)
    return primer


def update_primer(db: Session, primer: Primer, data: PrimerUpdate) -> Primer:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(primer, field, value)
    db.commit()
    db.refresh(primer)
    return primer


def delete_primer(db: Session, primer: Primer) -> None:
    db.delete(primer)
    db.commit()


def bulk_create_primers(db: Session, primers_data: List[PrimerCreate]) -> List[Primer]:
    primers = [Primer(**data.model_dump()) for data in primers_data]
    db.add_all(primers)
    db.commit()
    for p in primers:
        db.refresh(p)
    return primers
