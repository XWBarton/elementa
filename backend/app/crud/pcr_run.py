from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.pcr_run import PCRRun, PCRSample
from app.schemas.pcr_run import PCRRunCreate, PCRRunUpdate, PCRSampleCreate, PCRSampleUpdate


def _run_query(db: Session):
    return db.query(PCRRun).options(
        joinedload(PCRRun.operator),
        joinedload(PCRRun.protocol),
        joinedload(PCRRun.samples).joinedload(PCRSample.extraction),
    )


def get_runs(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    project_id: Optional[int] = None,
    operator_id: Optional[int] = None,
) -> Tuple[List[PCRRun], int]:
    q = _run_query(db)
    cq = db.query(func.count(PCRRun.id))
    if project_id is not None:
        q = q.filter(PCRRun.project_id == project_id)
        cq = cq.filter(PCRRun.project_id == project_id)
    if operator_id is not None:
        q = q.filter(PCRRun.operator_id == operator_id)
        cq = cq.filter(PCRRun.operator_id == operator_id)
    total = cq.scalar()
    items = q.order_by(PCRRun.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_run(db: Session, run_id: int) -> Optional[PCRRun]:
    return _run_query(db).filter(PCRRun.id == run_id).first()


def create_run(db: Session, data: PCRRunCreate) -> PCRRun:
    run = PCRRun(**data.model_dump())
    db.add(run)
    db.commit()
    db.refresh(run)
    return get_run(db, run.id)


def update_run(db: Session, obj: PCRRun, data: PCRRunUpdate) -> PCRRun:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return get_run(db, obj.id)


def delete_run(db: Session, obj: PCRRun) -> None:
    db.delete(obj)
    db.commit()


def add_sample(db: Session, run_id: int, data: PCRSampleCreate) -> PCRSample:
    sample = PCRSample(run_id=run_id, **data.model_dump())
    db.add(sample)
    db.commit()
    return db.query(PCRSample).options(joinedload(PCRSample.extraction)).filter(PCRSample.id == sample.id).first()


def update_sample(db: Session, sample: PCRSample, data: PCRSampleUpdate) -> PCRSample:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(sample, key, value)
    db.commit()
    return db.query(PCRSample).options(joinedload(PCRSample.extraction)).filter(PCRSample.id == sample.id).first()


def delete_sample(db: Session, sample: PCRSample) -> None:
    db.delete(sample)
    db.commit()


def get_sample(db: Session, sample_id: int) -> Optional[PCRSample]:
    return db.query(PCRSample).options(joinedload(PCRSample.run)).filter(PCRSample.id == sample_id).first()


def add_samples_bulk(db: Session, run_id: int, specimen_codes: list[str]) -> list[PCRSample]:
    samples = []
    for code in specimen_codes:
        s = PCRSample(run_id=run_id, specimen_code=code)
        db.add(s)
        db.flush()
        samples.append(s.id)
    db.commit()
    return [
        db.query(PCRSample).options(joinedload(PCRSample.extraction)).filter(PCRSample.id == sid).first()
        for sid in samples
    ]


def list_all_pcr_samples(db: Session) -> List[PCRSample]:
    """For Sanger dropdown selectors."""
    return (
        db.query(PCRSample)
        .options(joinedload(PCRSample.extraction), joinedload(PCRSample.run))
        .all()
    )
