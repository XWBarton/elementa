import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.crud import library_prep_run as crud
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.library_prep_run import (
    LibraryPrepCreate,
    LibraryPrepRead,
    LibraryPrepRunCreate,
    LibraryPrepRunDetail,
    LibraryPrepRunRead,
    LibraryPrepRunUpdate,
    LibraryPrepUpdate,
)

router = APIRouter(prefix="/library-prep-runs", tags=["library-prep-runs"])


def _run_read(obj) -> LibraryPrepRunRead:
    data = LibraryPrepRunRead.model_validate(obj)
    data.sample_count = len(obj.samples)
    return data


def _run_detail(obj) -> LibraryPrepRunDetail:
    data = LibraryPrepRunDetail.model_validate(obj)
    data.sample_count = len(obj.samples)
    return data


@router.get("/", response_model=dict)
def list_runs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), _=Depends(get_current_user)):
    items, total = crud.get_runs(db, skip=skip, limit=limit)
    return {"items": [_run_read(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=LibraryPrepRunDetail)
def create_run(data: LibraryPrepRunCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.create_run(db, data)
    return _run_detail(obj)


@router.get("/all-preps", response_model=list[LibraryPrepRead])
def all_preps(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.list_all_preps(db)


@router.get("/{run_id}", response_model=LibraryPrepRunDetail)
def read_run(run_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Library prep run not found")
    return _run_detail(obj)


@router.put("/{run_id}", response_model=LibraryPrepRunDetail)
def update_run(run_id: int, data: LibraryPrepRunUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Library prep run not found")
    obj = crud.update_run(db, obj, data)
    return _run_detail(obj)


@router.delete("/{run_id}")
def delete_run(run_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Library prep run not found")
    crud.delete_run(db, obj)
    return {"detail": "Deleted"}


@router.post("/{run_id}/samples", response_model=LibraryPrepRead)
def add_sample(run_id: int, data: LibraryPrepCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Library prep run not found")
    return crud.add_sample(db, run_id, data)


@router.put("/{run_id}/samples/{sample_id}", response_model=LibraryPrepRead)
def update_sample(
    run_id: int,
    sample_id: int,
    data: LibraryPrepUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    sample = crud.get_sample(db, sample_id)
    if not sample or sample.run_id != run_id:
        raise HTTPException(status_code=404, detail="Sample not found")
    return crud.update_sample(db, sample, data)


@router.delete("/{run_id}/samples/{sample_id}")
def delete_sample(run_id: int, sample_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sample = crud.get_sample(db, sample_id)
    if not sample or sample.run_id != run_id:
        raise HTTPException(status_code=404, detail="Sample not found")
    crud.delete_sample(db, sample)
    return {"detail": "Deleted"}


@router.get("/{run_id}/export")
def export_run(run_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Library prep run not found")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["run_id", "run_date", "kit", "target_region", "primer_f", "primer_r",
                "specimen_code", "sample_name", "extraction_id",
                "index_i7", "index_i5", "input_ng", "average_fragment_size_bp",
                "library_concentration_ng_ul", "qc_status", "notes"])
    for s in obj.samples:
        code = s.specimen_code or (s.extraction.specimen_code if s.extraction else "")
        w.writerow([obj.id, obj.run_date, obj.kit, obj.target_region, obj.primer_f, obj.primer_r,
                    code, s.sample_name, s.extraction_id,
                    s.index_i7, s.index_i5, s.input_ng, s.average_fragment_size_bp,
                    s.library_concentration_ng_ul, s.qc_status, s.notes])
    buf.seek(0)
    return StreamingResponse(buf, media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="library-prep-run-{run_id}.csv"'})
