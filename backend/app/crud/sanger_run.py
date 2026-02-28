from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.sanger_run import SangerRun, SangerSample
from app.models.pcr_run import PCRSample
from app.schemas.sanger_run import SangerRunCreate, SangerRunUpdate, SangerSampleCreate, SangerSampleUpdate


def _run_query(db: Session):
    return db.query(SangerRun).options(
        joinedload(SangerRun.operator),
        joinedload(SangerRun.protocol),
        joinedload(SangerRun.samples).joinedload(SangerSample.pcr_sample).joinedload(PCRSample.extraction),
    )


def get_runs(db: Session, skip: int = 0, limit: int = 50) -> Tuple[List[SangerRun], int]:
    total = db.query(func.count(SangerRun.id)).scalar()
    items = _run_query(db).order_by(SangerRun.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_run(db: Session, run_id: int) -> Optional[SangerRun]:
    return _run_query(db).filter(SangerRun.id == run_id).first()


def create_run(db: Session, data: SangerRunCreate) -> SangerRun:
    run = SangerRun(**data.model_dump())
    db.add(run)
    db.commit()
    db.refresh(run)
    return get_run(db, run.id)


def update_run(db: Session, obj: SangerRun, data: SangerRunUpdate) -> SangerRun:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return get_run(db, obj.id)


def delete_run(db: Session, obj: SangerRun) -> None:
    db.delete(obj)
    db.commit()


def add_sample(db: Session, run_id: int, data: SangerSampleCreate) -> SangerSample:
    sample = SangerSample(run_id=run_id, **data.model_dump())
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return (
        db.query(SangerSample)
        .options(joinedload(SangerSample.pcr_sample).joinedload(PCRSample.extraction))
        .filter(SangerSample.id == sample.id)
        .first()
    )


def update_sample(db: Session, sample: SangerSample, data: SangerSampleUpdate) -> SangerSample:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(sample, key, value)
    db.commit()
    db.refresh(sample)
    return (
        db.query(SangerSample)
        .options(joinedload(SangerSample.pcr_sample).joinedload(PCRSample.extraction))
        .filter(SangerSample.id == sample.id)
        .first()
    )


def delete_sample(db: Session, sample: SangerSample) -> None:
    db.delete(sample)
    db.commit()


def get_sample(db: Session, sample_id: int) -> Optional[SangerSample]:
    return db.query(SangerSample).filter(SangerSample.id == sample_id).first()
