from sqlalchemy.orm import Session
from app.models.primer import Primer, PrimerPair
from app.schemas.primer import PrimerCreate, PrimerUpdate, PrimerPairCreate, PrimerPairUpdate
from typing import List, Optional


# ── Primers ───────────────────────────────────────────────────────

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


# ── Primer Pairs ──────────────────────────────────────────────────

def get_primer_pairs(db: Session, q: Optional[str] = None) -> List[PrimerPair]:
    query = db.query(PrimerPair)
    if q:
        like = f"%{q}%"
        query = query.filter(
            PrimerPair.name.ilike(like) |
            PrimerPair.target_gene.ilike(like) |
            PrimerPair.target_taxa.ilike(like)
        )
    return query.order_by(PrimerPair.name).all()


def get_primer_pair(db: Session, pair_id: int) -> Optional[PrimerPair]:
    return db.query(PrimerPair).filter(PrimerPair.id == pair_id).first()


def create_primer_pair(db: Session, data: PrimerPairCreate) -> PrimerPair:
    pair = PrimerPair(**data.model_dump())
    db.add(pair)
    db.commit()
    db.refresh(pair)
    return pair


def update_primer_pair(db: Session, pair: PrimerPair, data: PrimerPairUpdate) -> PrimerPair:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pair, field, value)
    db.commit()
    db.refresh(pair)
    return pair


def delete_primer_pair(db: Session, pair: PrimerPair) -> None:
    db.delete(pair)
    db.commit()
