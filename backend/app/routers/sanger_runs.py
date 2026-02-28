import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.crud import sanger_run as crud
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.sanger_run import (
    SangerRunCreate,
    SangerRunDetail,
    SangerRunRead,
    SangerRunUpdate,
    SangerSampleCreate,
    SangerSampleRead,
    SangerSampleUpdate,
)

router = APIRouter(prefix="/sanger-runs", tags=["sanger-runs"])


def _run_read(obj) -> SangerRunRead:
    data = SangerRunRead.model_validate(obj)
    data.sample_count = len(obj.samples)
    return data


def _run_detail(obj) -> SangerRunDetail:
    data = SangerRunDetail.model_validate(obj)
    data.sample_count = len(obj.samples)
    return data


@router.get("/", response_model=dict)
def list_runs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), _=Depends(get_current_user)):
    items, total = crud.get_runs(db, skip=skip, limit=limit)
    return {"items": [_run_read(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=SangerRunDetail)
def create_run(data: SangerRunCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.create_run(db, data)
    return _run_detail(obj)


@router.get("/{run_id}", response_model=SangerRunDetail)
def read_run(run_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sanger run not found")
    return _run_detail(obj)


@router.put("/{run_id}", response_model=SangerRunDetail)
def update_run(run_id: int, data: SangerRunUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sanger run not found")
    obj = crud.update_run(db, obj, data)
    return _run_detail(obj)


@router.delete("/{run_id}")
def delete_run(run_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sanger run not found")
    crud.delete_run(db, obj)
    return {"detail": "Deleted"}


@router.post("/{run_id}/samples", response_model=SangerSampleRead)
def add_sample(run_id: int, data: SangerSampleCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Sanger run not found")
    return crud.add_sample(db, run_id, data)


@router.put("/{run_id}/samples/{sample_id}", response_model=SangerSampleRead)
def update_sample(
    run_id: int,
    sample_id: int,
    data: SangerSampleUpdate,
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
        raise HTTPException(status_code=404, detail="Sanger run not found")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["run_id", "run_date", "primer", "direction", "service_provider", "order_id",
                "specimen_code", "pcr_sample_id", "sequence_length_bp",
                "quality_notes", "qc_status", "output_file_path", "notes"])
    for s in obj.samples:
        code = s.specimen_code or (s.pcr_sample.specimen_code if s.pcr_sample else "")
        w.writerow([obj.id, obj.run_date, obj.primer, obj.direction,
                    obj.service_provider, obj.order_id,
                    code, s.pcr_sample_id, s.sequence_length_bp,
                    s.quality_notes, s.qc_status, s.output_file_path, s.notes])
    buf.seek(0)
    return StreamingResponse(buf, media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="sanger-run-{run_id}.csv"'})
