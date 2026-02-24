from datetime import date
from typing import Optional, Tuple, List

from sqlalchemy.orm import Session, joinedload

from app.models.ngs_run import NGSRun, NGSRunLibrary
from app.models.library_prep_run import LibraryPrep
from app.schemas.ngs_run import NGSRunCreate, NGSRunUpdate


def _base_query(db: Session):
    return db.query(NGSRun).options(
        joinedload(NGSRun.operator),
        joinedload(NGSRun.libraries).joinedload(NGSRunLibrary.library_prep).joinedload(LibraryPrep.extraction),
    )


def get_ngs_runs(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    platform: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> Tuple[List[NGSRun], int]:
    q = _base_query(db)
    if platform:
        q = q.filter(NGSRun.platform == platform)
    if date_from:
        q = q.filter(NGSRun.date >= date_from)
    if date_to:
        q = q.filter(NGSRun.date <= date_to)
    total = q.count()
    items = q.order_by(NGSRun.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_ngs_run(db: Session, run_id: int) -> Optional[NGSRun]:
    return _base_query(db).filter(NGSRun.id == run_id).first()


def create_ngs_run(db: Session, data: NGSRunCreate) -> NGSRun:
    libraries_data = data.libraries
    run_data = data.model_dump(exclude={"libraries"})
    run = NGSRun(**run_data)
    db.add(run)
    db.flush()
    for lib in libraries_data:
        junction = NGSRunLibrary(ngs_run_id=run.id, **lib.model_dump())
        db.add(junction)
    db.commit()
    db.refresh(run)
    return get_ngs_run(db, run.id)


def update_ngs_run(db: Session, obj: NGSRun, data: NGSRunUpdate) -> NGSRun:
    update_data = data.model_dump(exclude_unset=True)
    libraries_data = update_data.pop("libraries", None)
    for key, value in update_data.items():
        setattr(obj, key, value)
    if libraries_data is not None:
        db.query(NGSRunLibrary).filter(NGSRunLibrary.ngs_run_id == obj.id).delete()
        db.flush()
        for lib in libraries_data:
            junction = NGSRunLibrary(ngs_run_id=obj.id, **lib)
            db.add(junction)
    db.commit()
    db.refresh(obj)
    return get_ngs_run(db, obj.id)


def delete_ngs_run(db: Session, obj: NGSRun) -> None:
    db.delete(obj)
    db.commit()
