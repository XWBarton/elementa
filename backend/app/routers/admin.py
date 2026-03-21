import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request

from fastapi import APIRouter, Depends, HTTPException

log = logging.getLogger(__name__)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_admin
from app.models.app_setting import AppSetting
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

ALLOWED_KEYS = {"tessera_url", "tessera_api_token"}


class SettingValue(BaseModel):
    value: str


class TesseraLinkPayload(BaseModel):
    specimen_code: str
    elementa_ref: str
    run_type: str
    input_quantity: float | None = None
    input_quantity_unit: str | None = None


def _get_settings_map(db: Session) -> dict[str, str]:
    return {s.key: s.value for s in db.query(AppSetting).all()}


def _server_url(url: str) -> str:
    """Use TESSERA_INTERNAL_URL env var if set (for tunnelled/cloud deployments where
    the public URL isn't reachable from inside Docker), otherwise rewrite
    localhost → host.docker.internal so requests escape the container."""
    internal = os.environ.get("TESSERA_INTERNAL_URL", "").strip()
    if internal:
        return internal.rstrip("/")
    return re.sub(r"(?i)^(https?://)localhost\b", r"\1host.docker.internal", url.rstrip("/"))


@router.get("/public-settings")
def get_public_settings(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Non-admin endpoint — returns only the values needed by the UI for all users."""
    m = _get_settings_map(db)
    return {"tessera_url": m.get("tessera_url", "")}


@router.get("/settings/")
def get_settings(db: Session = Depends(get_db), _=Depends(require_admin)):
    m = _get_settings_map(db)
    return {
        "tessera_url": m.get("tessera_url", ""),
        "tessera_token_set": bool(m.get("tessera_api_token")),
    }


@router.put("/settings/{key}")
def set_setting(
    key: str,
    payload: SettingValue,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail="Unknown setting key")
    existing = db.query(AppSetting).filter(AppSetting.key == key).first()
    if existing:
        existing.value = payload.value
    else:
        db.add(AppSetting(key=key, value=payload.value))
    db.commit()
    return {"ok": True}


@router.get("/tessera/test")
def test_tessera(url: str = "", token: str = "", db: Session = Depends(get_db), _=Depends(require_admin)):
    if not url or not token:
        m = _get_settings_map(db)
        url = url or m.get("tessera_url", "").strip()
        token = token or m.get("tessera_api_token", "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="Tessera URL not configured")
    if not token:
        raise HTTPException(status_code=400, detail="Tessera API token not configured")
    req = urllib.request.Request(
        f"{_server_url(url)}/api/specimens/?limit=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        urllib.request.urlopen(req, timeout=8)
        return {"ok": True}
    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=502, detail="Tessera rejected the request — check the API token")
    except Exception as e:
        log.error("Tessera connection failed: %s", e)
        raise HTTPException(status_code=502, detail="Could not reach Tessera")


@router.get("/tessera/search")
def search_tessera(q: str = "", db: Session = Depends(get_db), _=Depends(get_current_user)):
    if not q or len(q) < 2:
        return []

    m = _get_settings_map(db)
    url = m.get("tessera_url", "").strip()
    token = m.get("tessera_api_token", "").strip()
    if not url or not token:
        return []

    params = urllib.parse.urlencode({"search": q, "limit": 10})
    req = urllib.request.Request(
        f"{_server_url(url)}/api/specimens/?{params}",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=8)
        data = json.loads(resp.read())
        items = data.get("items", []) if isinstance(data, dict) else data
        return [_format(s) for s in items]
    except HTTPException:
        raise
    except Exception as e:
        log.error("Tessera search failed: %s", e)
        raise HTTPException(status_code=502, detail="Could not reach Tessera")


@router.post("/tessera/link")
def link_tessera_specimen(payload: TesseraLinkPayload, db: Session = Depends(get_db), _=Depends(get_current_user)):
    m = _get_settings_map(db)
    url = m.get("tessera_url", "").strip()
    token = m.get("tessera_api_token", "").strip()
    if not url or not token:
        return {"ok": False}
    data = json.dumps({
        "specimen_code": payload.specimen_code,
        "elementa_ref": payload.elementa_ref,
        "run_type": payload.run_type,
        "input_quantity": payload.input_quantity,
        "input_quantity_unit": payload.input_quantity_unit,
    }).encode()
    req = urllib.request.Request(
        f"{_server_url(url)}/api/specimens/link-elementa",
        data=data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=8)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return {"ok": False}  # specimen not in Tessera — silent
        return {"ok": False}
    except Exception:
        return {"ok": False}


@router.get("/specimen-history/{specimen_code}")
def get_specimen_history(
    specimen_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all molecular runs linked to a specimen code."""
    from app.models.extraction_run import ExtractionRun, Extraction
    from app.models.pcr_run import PCRRun, PCRSample
    from app.models.sanger_run import SangerRun, SangerSample
    from app.models.library_prep_run import LibraryPrepRun, LibraryPrep
    from app.models.ngs_run import NGSRun, NGSRunLibrary
    from sqlalchemy.orm import joinedload

    extractions = (
        db.query(Extraction)
        .join(ExtractionRun, Extraction.run_id == ExtractionRun.id)
        .options(joinedload(Extraction.run).joinedload(ExtractionRun.operator))
        .filter(Extraction.specimen_code == specimen_code)
        .all()
    )

    pcr_samples = (
        db.query(PCRSample)
        .join(PCRRun, PCRSample.run_id == PCRRun.id)
        .options(joinedload(PCRSample.run).joinedload(PCRRun.operator))
        .filter(PCRSample.specimen_code == specimen_code)
        .all()
    )

    sanger_samples = (
        db.query(SangerSample)
        .join(SangerRun, SangerSample.run_id == SangerRun.id)
        .options(joinedload(SangerSample.run).joinedload(SangerRun.operator))
        .filter(SangerSample.specimen_code == specimen_code)
        .all()
    )

    library_preps = (
        db.query(LibraryPrep)
        .join(LibraryPrepRun, LibraryPrep.run_id == LibraryPrepRun.id)
        .options(joinedload(LibraryPrep.run).joinedload(LibraryPrepRun.operator))
        .filter(LibraryPrep.specimen_code == specimen_code)
        .all()
    )

    ngs_libraries = (
        db.query(NGSRunLibrary)
        .join(NGSRun, NGSRunLibrary.ngs_run_id == NGSRun.id)
        .options(joinedload(NGSRunLibrary.ngs_run).joinedload(NGSRun.operator))
        .filter(NGSRunLibrary.specimen_code == specimen_code)
        .all()
    )

    def _run_info(run):
        return {
            "id": run.id,
            "date": str(getattr(run, 'run_date', None) or getattr(run, 'date', None) or ''),
            "operator": run.operator.username if run.operator else None,
            "project_id": run.project_id,
        }

    return {
        "specimen_code": specimen_code,
        "extractions": [
            {**_run_info(e.run), "run_id": e.run_id, "sample_id": e.id,
             "yield_ng_ul": e.yield_ng_ul, "qc_status": e.qc_status,
             "extraction_type": e.run.extraction_type if e.run else None}
            for e in extractions
        ],
        "pcr_samples": [
            {**_run_info(s.run), "run_id": s.run_id, "sample_id": s.id,
             "target_region": s.run.target_region if s.run else None,
             "gel_result": s.gel_result, "qc_status": s.qc_status}
            for s in pcr_samples
        ],
        "sanger_samples": [
            {**_run_info(s.run), "run_id": s.run_id, "sample_id": s.id,
             "sequence_length_bp": s.sequence_length_bp, "qc_status": s.qc_status,
             "primer": s.run.primer if s.run else None}
            for s in sanger_samples
        ],
        "library_preps": [
            {**_run_info(lp.run), "run_id": lp.run_id, "sample_id": lp.id,
             "index_i7": lp.index_i7, "index_i5": lp.index_i5,
             "qc_status": lp.qc_status}
            for lp in library_preps
        ],
        "ngs_libraries": [
            {**_run_info(lib.ngs_run), "run_id": lib.ngs_run_id, "library_id": lib.id,
             "platform": lib.ngs_run.platform if lib.ngs_run else None,
             "reads_millions": lib.reads_millions, "qc_status": lib.qc_status}
            for lib in ngs_libraries
        ],
    }


def _format(s: dict) -> dict:
    assocs = s.get("species_associations") or []
    primary = next(
        (a for a in assocs if a.get("is_primary")),
        assocs[0] if assocs else None,
    )
    species = ""
    if primary:
        species = (
            primary.get("free_text_species")
            or (primary.get("species") or {}).get("common_name")
            or (primary.get("species") or {}).get("scientific_name")
            or ""
        )
    project = s.get("project") or {}
    return {
        "specimen_code": s["specimen_code"],
        "primary_species": species,
        "project_code": project.get("code", ""),
        "collection_date": s.get("collection_date"),
    }
