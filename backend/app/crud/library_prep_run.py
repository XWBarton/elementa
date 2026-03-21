from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.library_prep_run import LibraryPrepRun, LibraryPrep
from app.models.pcr_run import PCRSample
from app.schemas.library_prep_run import LibraryPrepRunCreate, LibraryPrepRunUpdate, LibraryPrepCreate, LibraryPrepUpdate


def _run_query(db: Session):
    return db.query(LibraryPrepRun).options(
        joinedload(LibraryPrepRun.operator),
        joinedload(LibraryPrepRun.protocol),
        joinedload(LibraryPrepRun.samples).joinedload(LibraryPrep.extraction),
        joinedload(LibraryPrepRun.samples).joinedload(LibraryPrep.pcr_sample).joinedload(PCRSample.extraction),
    )


def _sample_query(db: Session):
    return db.query(LibraryPrep).options(
        joinedload(LibraryPrep.extraction),
        joinedload(LibraryPrep.pcr_sample).joinedload(PCRSample.extraction),
    )


def get_runs(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    project_id: Optional[int] = None,
    operator_id: Optional[int] = None,
) -> Tuple[List[LibraryPrepRun], int]:
    q = _run_query(db)
    cq = db.query(func.count(LibraryPrepRun.id))
    if project_id is not None:
        q = q.filter(LibraryPrepRun.project_id == project_id)
        cq = cq.filter(LibraryPrepRun.project_id == project_id)
    if operator_id is not None:
        q = q.filter(LibraryPrepRun.operator_id == operator_id)
        cq = cq.filter(LibraryPrepRun.operator_id == operator_id)
    total = cq.scalar()
    items = q.order_by(LibraryPrepRun.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_run(db: Session, run_id: int) -> Optional[LibraryPrepRun]:
    return _run_query(db).filter(LibraryPrepRun.id == run_id).first()


def create_run(db: Session, data: LibraryPrepRunCreate) -> LibraryPrepRun:
    run = LibraryPrepRun(**data.model_dump())
    db.add(run)
    db.commit()
    db.refresh(run)
    return get_run(db, run.id)


def update_run(db: Session, obj: LibraryPrepRun, data: LibraryPrepRunUpdate) -> LibraryPrepRun:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return get_run(db, obj.id)


def delete_run(db: Session, obj: LibraryPrepRun) -> None:
    db.delete(obj)
    db.commit()


def add_sample(db: Session, run_id: int, data: LibraryPrepCreate) -> LibraryPrep:
    sample = LibraryPrep(run_id=run_id, **data.model_dump())
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return _sample_query(db).filter(LibraryPrep.id == sample.id).first()


def update_sample(db: Session, sample: LibraryPrep, data: LibraryPrepUpdate) -> LibraryPrep:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(sample, key, value)
    db.commit()
    db.refresh(sample)
    return _sample_query(db).filter(LibraryPrep.id == sample.id).first()


def delete_sample(db: Session, sample: LibraryPrep) -> None:
    db.delete(sample)
    db.commit()


def get_sample(db: Session, sample_id: int) -> Optional[LibraryPrep]:
    return db.query(LibraryPrep).options(
        joinedload(LibraryPrep.run),
        joinedload(LibraryPrep.extraction),
        joinedload(LibraryPrep.pcr_sample).joinedload(PCRSample.extraction),
    ).filter(LibraryPrep.id == sample_id).first()


def add_samples_bulk(db: Session, run_id: int, specimen_codes: list[str]) -> list[LibraryPrep]:
    samples = []
    for code in specimen_codes:
        s = LibraryPrep(run_id=run_id, specimen_code=code)
        db.add(s)
        db.flush()
        samples.append(s.id)
    db.commit()
    return [
        db.query(LibraryPrep).options(joinedload(LibraryPrep.extraction)).filter(LibraryPrep.id == sid).first()
        for sid in samples
    ]


def list_all_preps(db: Session) -> List[LibraryPrep]:
    """For NGS dropdown selectors."""
    return (
        db.query(LibraryPrep)
        .options(
            joinedload(LibraryPrep.extraction),
            joinedload(LibraryPrep.pcr_sample).joinedload(PCRSample.extraction),
            joinedload(LibraryPrep.run),
        )
        .all()
    )
