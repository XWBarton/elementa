import csv
import io
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.crud.ngs_run import (
    create_ngs_run, delete_ngs_run, get_ngs_run, get_ngs_runs, update_ngs_run,
)
from app.dependencies import get_current_user, get_db, require_admin
from app.models.user import User
from app.schemas.ngs_run import NGSRunCreate, NGSRunRead, NGSRunUpdate

router = APIRouter(prefix="/ngs-runs", tags=["ngs"])


def _has_access(run, user: User) -> bool:
    project = run.project if run else None
    if not project or not project.is_protected:
        return True
    if user.is_admin:
        return True
    return any(m.id == user.id for m in project.members)


@router.get("/", response_model=dict)
def list_runs(
    skip: int = 0,
    limit: int = 50,
    platform: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    project_id: Optional[int] = None,
    operator_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = get_ngs_runs(db, skip=skip, limit=limit, platform=platform, date_from=date_from, date_to=date_to, project_id=project_id, operator_id=operator_id)
    accessible = [i for i in items if _has_access(i, current_user)]
    return {"items": [NGSRunRead.model_validate(i) for i in accessible], "total": len(accessible), "skip": skip, "limit": limit}


@router.post("/", response_model=NGSRunRead)
def create(data: NGSRunCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return create_ngs_run(db, data)


@router.get("/{run_id}", response_model=NGSRunRead)
def read_run(run_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_ngs_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="NGS run not found")
    if not _has_access(obj, current_user):
        raise HTTPException(status_code=403, detail="Access restricted")
    return obj


@router.put("/{run_id}", response_model=NGSRunRead)
def update(run_id: int, data: NGSRunUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_ngs_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="NGS run not found")
    if not _has_access(obj, current_user):
        raise HTTPException(status_code=403, detail="Access restricted")
    return update_ngs_run(db, obj, data)


@router.delete("/{run_id}")
def delete(run_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    obj = get_ngs_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="NGS run not found")
    delete_ngs_run(db, obj)
    return {"detail": "Deleted"}


@router.get("/{run_id}/export")
def export_run(run_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_ngs_run(db, run_id)
    if not obj:
        raise HTTPException(status_code=404, detail="NGS run not found")
    if not _has_access(obj, current_user):
        raise HTTPException(status_code=403, detail="Access restricted")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["run_id", "platform", "instrument", "date", "flow_cell_id", "reagent_kit",
                "total_reads", "q30_percent", "mean_read_length_bp",
                "specimen_code", "sample_name", "library_prep_id",
                "reads_millions", "qc_status"])
    for lib in obj.libraries:
        code = lib.specimen_code or (lib.library_prep.specimen_code if lib.library_prep else "")
        w.writerow([obj.id, obj.platform, obj.instrument, obj.date, obj.flow_cell_id, obj.reagent_kit,
                    obj.total_reads, obj.q30_percent, obj.mean_read_length_bp,
                    code, lib.sample_name, lib.library_prep_id,
                    lib.reads_millions, lib.qc_status])
    buf.seek(0)
    return StreamingResponse(buf, media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="ngs-run-{run_id}.csv"'})
