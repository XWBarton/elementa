import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.crud import pcr_run as crud
from app.dependencies import get_current_user, get_db, require_admin
from app.tessera_client import notify_unlink
from app.schemas.pcr_run import (
    PCRRunCreate,
    PCRRunDetail,
    PCRRunRead,
    PCRRunUpdate,
    PCRSampleCreate,
    PCRSampleRead,
    PCRSampleUpdate,
)

router = APIRouter(prefix="/pcr-runs", tags=["pcr-runs"])


def _run_read(obj) -> PCRRunRead:
    data = PCRRunRead.model_validate(obj)
    data.sample_count = len(obj.samples)
    return data


def _run_detail(obj) -> PCRRunDetail:
    data = PCRRunDetail.model_validate(obj)
    data.sample_count = len(obj.samples)
    return data


@router.get("/", response_model=dict)
def list_runs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), _=Depends(get_current_user)):
    items, total = crud.get_runs(db, skip=skip, limit=limit)
    return {"items": [_run_read(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=PCRRunDetail)
def create_run(data: PCRRunCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.create_run(db, data)
    return _run_detail(obj)


@router.get("/all-samples", response_model=list[PCRSampleRead])
def all_pcr_samples(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.list_all_pcr_samples(db)


@router.get("/{run_id}", response_model=PCRRunDetail)
def read_run(run_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="PCR run not found")
    return _run_detail(obj)


@router.put("/{run_id}", response_model=PCRRunDetail)
def update_run(run_id: int, data: PCRRunUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="PCR run not found")
    obj = crud.update_run(db, obj, data)
    return _run_detail(obj)


@router.delete("/{run_id}")
def delete_run(run_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="PCR run not found")
    crud.delete_run(db, obj)
    return {"detail": "Deleted"}


@router.post("/{run_id}/samples", response_model=PCRSampleRead)
def add_sample(run_id: int, data: PCRSampleCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="PCR run not found")
    return crud.add_sample(db, run_id, data)


@router.put("/{run_id}/samples/{sample_id}", response_model=PCRSampleRead)
def update_sample(
    run_id: int,
    sample_id: int,
    data: PCRSampleUpdate,
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
    specimen_code = sample.specimen_code
    crud.delete_sample(db, sample)
    notify_unlink(db, specimen_code, str(run_id))
    return {"detail": "Deleted"}


@router.get("/{run_id}/export")
def export_run(run_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="PCR run not found")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["run_id", "run_date", "target_region", "primer_f", "primer_r",
                "annealing_temp_c", "cycles", "polymerase", "amplicon_size_bp",
                "specimen_code", "extraction_id", "gel_result", "qc_status", "notes"])
    for s in obj.samples:
        code = s.specimen_code or (s.extraction.specimen_code if s.extraction else "")
        w.writerow([obj.id, obj.run_date, obj.target_region, obj.primer_f, obj.primer_r,
                    obj.annealing_temp_c, obj.cycles, obj.polymerase, obj.amplicon_size_bp,
                    code, s.extraction_id, s.gel_result, s.qc_status, s.notes])
    buf.seek(0)
    return StreamingResponse(buf, media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="pcr-run-{run_id}.csv"'})
