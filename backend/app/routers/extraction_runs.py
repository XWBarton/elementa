import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.crud import extraction_run as crud
from app.dependencies import get_current_user, get_db, require_admin
from app.tessera_client import notify_unlink
from app.schemas.extraction_run import (
    ExtractionCreate,
    ExtractionRead,
    ExtractionRunCreate,
    ExtractionRunDetail,
    ExtractionRunRead,
    ExtractionRunUpdate,
    ExtractionUpdate,
)

router = APIRouter(prefix="/extraction-runs", tags=["extraction-runs"])


def _run_read(obj) -> ExtractionRunRead:
    data = ExtractionRunRead.model_validate(obj)
    data.sample_count = len(obj.samples)
    return data


def _run_detail(obj) -> ExtractionRunDetail:
    data = ExtractionRunDetail.model_validate(obj)
    data.sample_count = len(obj.samples)
    return data


@router.get("/", response_model=dict)
def list_runs(
    skip: int = 0,
    limit: int = 50,
    project_id: Optional[int] = None,
    operator_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    items, total = crud.get_runs(db, skip=skip, limit=limit, project_id=project_id, operator_id=operator_id)
    return {"items": [_run_read(i) for i in items], "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=ExtractionRunDetail)
def create_run(data: ExtractionRunCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.create_run(db, data)
    return _run_detail(obj)


@router.get("/all-extractions")
def all_extractions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    extractions = crud.list_all_extractions(db)
    return [
        {
            "id": e.id,
            "run_id": e.run_id,
            "specimen_code": e.specimen_code,
            "run_date": str(e.run.run_date) if e.run and e.run.run_date else None,
            "extraction_type": e.run.extraction_type if e.run else None,
            "yield_ng_ul": e.yield_ng_ul,
            "qc_status": e.qc_status,
            "sample_type": e.sample_type,
            "storage_location": e.storage_location,
        }
        for e in extractions
    ]


@router.get("/{run_id}", response_model=ExtractionRunDetail)
def read_run(run_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Extraction run not found")
    return _run_detail(obj)


@router.put("/{run_id}", response_model=ExtractionRunDetail)
def update_run(run_id: int, data: ExtractionRunUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Extraction run not found")
    obj = crud.update_run(db, obj, data)
    return _run_detail(obj)


@router.delete("/{run_id}")
def delete_run(run_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Extraction run not found")
    specimen_codes = [s.specimen_code for s in obj.samples if s.specimen_code]
    crud.delete_run(db, obj)
    for code in specimen_codes:
        notify_unlink(db, code, str(run_id))
    return {"detail": "Deleted"}


@router.post("/{run_id}/samples", response_model=ExtractionRead)
def add_sample(run_id: int, data: ExtractionCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Extraction run not found")
    return crud.add_sample(db, run_id, data)


@router.post("/{run_id}/samples/bulk", response_model=list[ExtractionRead])
def add_samples_bulk(
    run_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = crud.get_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Extraction run not found")
    codes = payload.get("specimen_codes", [])
    return crud.add_samples_bulk(db, run_id, codes)


@router.put("/{run_id}/samples/{sample_id}", response_model=ExtractionRead)
def update_sample(
    run_id: int,
    sample_id: int,
    data: ExtractionUpdate,
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
        raise HTTPException(status_code=404, detail="Extraction run not found")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["run_id", "run_date", "kit", "extraction_type", "container_type",
                "specimen_code", "position", "input_quantity", "input_quantity_unit",
                "yield_ng_ul", "a260_280", "a260_230", "rin_score", "qc_status",
                "storage_location", "notes"])
    for s in obj.samples:
        w.writerow([obj.id, obj.run_date, obj.kit, obj.extraction_type, obj.container_type,
                    s.specimen_code, s.position, s.input_quantity, s.input_quantity_unit,
                    s.yield_ng_ul, s.a260_280, s.a260_230, s.rin_score, s.qc_status,
                    s.storage_location, s.notes])
    buf.seek(0)
    return StreamingResponse(buf, media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="extraction-run-{run_id}.csv"'})
