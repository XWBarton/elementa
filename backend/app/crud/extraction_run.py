from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.extraction_run import Extraction, ExtractionRun
from app.schemas.extraction_run import (
    ExtractionCreate,
    ExtractionRunCreate,
    ExtractionRunUpdate,
    ExtractionUpdate,
)


def _run_query(db: Session):
    return db.query(ExtractionRun).options(
        joinedload(ExtractionRun.operator),
        joinedload(ExtractionRun.protocol),
        joinedload(ExtractionRun.samples),
    )


def get_runs(db: Session, skip: int = 0, limit: int = 50) -> Tuple[List[ExtractionRun], int]:
    q = _run_query(db)
    total = db.query(func.count(ExtractionRun.id)).scalar()
    items = q.order_by(ExtractionRun.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_run(db: Session, run_id: int) -> Optional[ExtractionRun]:
    return _run_query(db).filter(ExtractionRun.id == run_id).first()


def create_run(db: Session, data: ExtractionRunCreate) -> ExtractionRun:
    run = ExtractionRun(**data.model_dump())
    db.add(run)
    db.commit()
    db.refresh(run)
    return get_run(db, run.id)


def update_run(db: Session, obj: ExtractionRun, data: ExtractionRunUpdate) -> ExtractionRun:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return get_run(db, obj.id)


def delete_run(db: Session, obj: ExtractionRun) -> None:
    db.delete(obj)
    db.commit()


def add_sample(db: Session, run_id: int, data: ExtractionCreate) -> Extraction:
    sample = Extraction(run_id=run_id, **data.model_dump())
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return sample


def add_samples_bulk(db: Session, run_id: int, specimen_codes: List[str]) -> List[Extraction]:
    samples = [Extraction(run_id=run_id, specimen_code=code.strip()) for code in specimen_codes if code.strip()]
    db.add_all(samples)
    db.commit()
    return samples


def update_sample(db: Session, sample: Extraction, data: ExtractionUpdate) -> Extraction:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(sample, key, value)
    db.commit()
    db.refresh(sample)
    return sample


def delete_sample(db: Session, sample: Extraction) -> None:
    db.delete(sample)
    db.commit()


def get_sample(db: Session, sample_id: int) -> Optional[Extraction]:
    return db.query(Extraction).filter(Extraction.id == sample_id).first()


def list_all_extractions(db: Session) -> List[Extraction]:
    """For PCR/LibPrep dropdown selectors."""
    return (
        db.query(Extraction)
        .options(joinedload(Extraction.run))
        .order_by(Extraction.specimen_code)
        .all()
    )
