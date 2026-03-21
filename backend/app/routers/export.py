import csv
import io
import os
import sqlite3
import tempfile
from datetime import datetime, timezone

from fastapi import Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.database import engine
from app.dependencies import get_current_user, get_db, require_admin
from app.config import settings
from fastapi import APIRouter

router = APIRouter(prefix="/export", tags=["export"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _csv_response(rows: list[dict], fieldnames: list[str], filename: str) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({k: ("" if v is None else v) for k, v in row.items()})
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── extractions ───────────────────────────────────────────────────────────────

EXTRACTION_FIELDS = [
    "extraction_run_id", "run_date", "kit", "extraction_type", "elution_volume_ul",
    "protocol_notes", "operator",
    "extraction_id", "specimen_code", "input_quantity", "input_quantity_unit",
    "yield_ng_ul", "a260_280", "a260_230", "rin_score", "storage_location", "notes",
]


@router.get("/extractions")
def export_extractions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.models.extraction_run import ExtractionRun, Extraction

    runs = (
        db.query(ExtractionRun)
        .options(joinedload(ExtractionRun.operator), joinedload(ExtractionRun.samples))
        .all()
    )
    rows = []
    for run in runs:
        for ex in run.samples:
            rows.append({
                "extraction_run_id": run.id,
                "run_date": run.run_date,
                "kit": run.kit,
                "extraction_type": run.extraction_type,
                "elution_volume_ul": run.elution_volume_ul,
                "protocol_notes": run.protocol_notes,
                "operator": run.operator.username if run.operator else None,
                "extraction_id": ex.id,
                "specimen_code": ex.specimen_code,
                "input_quantity": ex.input_quantity,
                "input_quantity_unit": ex.input_quantity_unit,
                "yield_ng_ul": ex.yield_ng_ul,
                "a260_280": ex.a260_280,
                "a260_230": ex.a260_230,
                "rin_score": ex.rin_score,
                "storage_location": ex.storage_location,
                "notes": ex.notes,
            })
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return _csv_response(rows, EXTRACTION_FIELDS, f"extractions_{today}.csv")


# ── pcr samples ───────────────────────────────────────────────────────────────

PCR_FIELDS = [
    "pcr_run_id", "run_date", "target_region", "primer_f", "primer_r",
    "annealing_temp_c", "cycles", "polymerase", "amplicon_size_bp", "run_notes", "operator",
    "pcr_sample_id", "specimen_code", "extraction_id", "gel_result", "notes",
]


@router.get("/pcr-samples")
def export_pcr_samples(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.models.pcr_run import PCRRun, PCRSample

    runs = (
        db.query(PCRRun)
        .options(
            joinedload(PCRRun.operator),
            joinedload(PCRRun.samples).joinedload(PCRSample.extraction),
        )
        .all()
    )
    rows = []
    for run in runs:
        for s in run.samples:
            rows.append({
                "pcr_run_id": run.id,
                "run_date": run.run_date,
                "target_region": run.target_region,
                "primer_f": run.primer_f,
                "primer_r": run.primer_r,
                "annealing_temp_c": run.annealing_temp_c,
                "cycles": run.cycles,
                "polymerase": run.polymerase,
                "amplicon_size_bp": run.amplicon_size_bp,
                "run_notes": run.notes,
                "operator": run.operator.username if run.operator else None,
                "pcr_sample_id": s.id,
                "specimen_code": s.specimen_code or (s.extraction.specimen_code if s.extraction else None),
                "extraction_id": s.extraction_id,
                "gel_result": s.gel_result,
                "notes": s.notes,
            })
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return _csv_response(rows, PCR_FIELDS, f"pcr_samples_{today}.csv")


# ── sanger samples ────────────────────────────────────────────────────────────

SANGER_FIELDS = [
    "sanger_run_id", "run_date", "primer", "direction", "service_provider", "order_id",
    "run_notes", "operator",
    "sanger_sample_id", "specimen_code", "pcr_sample_id",
    "sequence_length_bp", "quality_notes", "output_file_path", "notes",
]


@router.get("/sanger-samples")
def export_sanger_samples(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.models.sanger_run import SangerRun, SangerSample
    from app.models.pcr_run import PCRSample

    runs = (
        db.query(SangerRun)
        .options(
            joinedload(SangerRun.operator),
            joinedload(SangerRun.samples)
            .joinedload(SangerSample.pcr_sample)
            .joinedload(PCRSample.extraction),
        )
        .all()
    )
    rows = []
    for run in runs:
        for s in run.samples:
            pcr = s.pcr_sample
            specimen = (
                s.specimen_code
                or (pcr.specimen_code if pcr else None)
                or (pcr.extraction.specimen_code if pcr and pcr.extraction else None)
            )
            rows.append({
                "sanger_run_id": run.id,
                "run_date": run.run_date,
                "primer": run.primer,
                "direction": run.direction,
                "service_provider": run.service_provider,
                "order_id": run.order_id,
                "run_notes": run.notes,
                "operator": run.operator.username if run.operator else None,
                "sanger_sample_id": s.id,
                "specimen_code": specimen,
                "pcr_sample_id": s.pcr_sample_id,
                "sequence_length_bp": s.sequence_length_bp,
                "quality_notes": s.quality_notes,
                "output_file_path": s.output_file_path,
                "notes": s.notes,
            })
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return _csv_response(rows, SANGER_FIELDS, f"sanger_samples_{today}.csv")


# ── library preps ─────────────────────────────────────────────────────────────

LIBRARY_PREP_FIELDS = [
    "library_prep_run_id", "run_date", "kit", "target_region", "primer_f", "primer_r",
    "run_notes", "operator",
    "library_prep_id", "specimen_code", "extraction_id",
    "index_i7", "index_i5", "input_ng", "average_fragment_size_bp",
    "library_concentration_ng_ul", "sample_name", "notes",
]


@router.get("/library-preps")
def export_library_preps(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.models.library_prep_run import LibraryPrepRun, LibraryPrep

    runs = (
        db.query(LibraryPrepRun)
        .options(
            joinedload(LibraryPrepRun.operator),
            joinedload(LibraryPrepRun.samples).joinedload(LibraryPrep.extraction),
        )
        .all()
    )
    rows = []
    for run in runs:
        for p in run.samples:
            rows.append({
                "library_prep_run_id": run.id,
                "run_date": run.run_date,
                "kit": run.kit,
                "target_region": run.target_region,
                "primer_f": run.primer_f,
                "primer_r": run.primer_r,
                "run_notes": run.notes,
                "operator": run.operator.username if run.operator else None,
                "library_prep_id": p.id,
                "specimen_code": p.specimen_code or (p.extraction.specimen_code if p.extraction else None),
                "extraction_id": p.extraction_id,
                "index_i7": p.index_i7,
                "index_i5": p.index_i5,
                "input_ng": p.input_ng,
                "average_fragment_size_bp": p.average_fragment_size_bp,
                "library_concentration_ng_ul": p.library_concentration_ng_ul,
                "sample_name": p.sample_name,
                "notes": p.notes,
            })
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return _csv_response(rows, LIBRARY_PREP_FIELDS, f"library_preps_{today}.csv")


# ── ngs libraries ─────────────────────────────────────────────────────────────

NGS_FIELDS = [
    "ngs_run_id", "platform", "instrument", "run_id", "date", "operator",
    "flow_cell_id", "reagent_kit", "total_reads", "q30_percent", "mean_read_length_bp",
    "ngs_library_id", "specimen_code", "library_prep_id", "sample_name",
]


@router.get("/ngs-libraries")
def export_ngs_libraries(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.models.ngs_run import NGSRun, NGSRunLibrary
    from app.models.library_prep_run import LibraryPrep

    runs = (
        db.query(NGSRun)
        .options(
            joinedload(NGSRun.operator),
            joinedload(NGSRun.libraries)
            .joinedload(NGSRunLibrary.library_prep)
            .joinedload(LibraryPrep.extraction),
        )
        .all()
    )
    rows = []
    for run in runs:
        for lib in run.libraries:
            prep = lib.library_prep
            specimen = (
                lib.specimen_code
                or (prep.specimen_code if prep else None)
                or (prep.extraction.specimen_code if prep and prep.extraction else None)
            )
            rows.append({
                "ngs_run_id": run.id,
                "platform": run.platform,
                "instrument": run.instrument,
                "run_id": run.run_id,
                "date": run.date,
                "operator": run.operator.username if run.operator else None,
                "flow_cell_id": run.flow_cell_id,
                "reagent_kit": run.reagent_kit,
                "total_reads": run.total_reads,
                "q30_percent": run.q30_percent,
                "mean_read_length_bp": run.mean_read_length_bp,
                "ngs_library_id": lib.id,
                "specimen_code": specimen,
                "library_prep_id": lib.library_prep_id,
                "sample_name": lib.sample_name,
            })
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return _csv_response(rows, NGS_FIELDS, f"ngs_libraries_{today}.csv")


# ── database backup & restore ─────────────────────────────────────────────────

def _restore_db_bytes(data: bytes) -> None:
    """Restore a raw SQLite byte string into the live database."""
    if not data.startswith(b"SQLite format 3\x00"):
        raise HTTPException(status_code=400, detail="File is not a valid SQLite database")

    tmp_path = None
    try:
        fd, tmp_path = tempfile.mkstemp(suffix=".db")
        with os.fdopen(fd, "wb") as f:
            f.write(data)

        test_conn = sqlite3.connect(tmp_path)
        try:
            test_conn.execute("SELECT name FROM sqlite_master LIMIT 1").fetchall()
        except sqlite3.DatabaseError as e:
            raise HTTPException(status_code=400, detail=f"Database integrity check failed: {e}")
        finally:
            test_conn.close()

        engine.dispose()

        db_path = settings.DATABASE_URL.replace("sqlite:///", "", 1)
        src = sqlite3.connect(tmp_path)
        dst = sqlite3.connect(db_path)
        try:
            src.backup(dst)
        finally:
            src.close()
            dst.close()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/backup")
def download_backup(_=Depends(require_admin)):
    import io
    import json
    import zipfile
    from pathlib import Path

    db_path = settings.DATABASE_URL.replace("sqlite:///", "", 1)
    conn = sqlite3.connect(db_path)
    db_bytes = conn.serialize()
    conn.close()

    ATTACH_DIR = Path("/data/attachments")

    # Build manifest: arc_name -> filename on disk
    manifest = {}
    if ATTACH_DIR.exists():
        for f in ATTACH_DIR.iterdir():
            if f.is_file():
                arc = f"attachments/{f.name}"
                manifest[arc] = f.name

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("elementa.db", db_bytes)
        zf.writestr("attachment_manifest.json", json.dumps(manifest, indent=2))
        for arc_name, filename in manifest.items():
            disk_path = ATTACH_DIR / filename
            if disk_path.is_file():
                zf.write(disk_path, arcname=arc_name)

    buf.seek(0)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M")
    filename_out = f"elementa_backup_{timestamp}.zip"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename_out}"'},
    )


@router.post("/restore")
async def restore_backup(file: UploadFile = File(...), _=Depends(require_admin)):
    import io
    import json
    import shutil
    import zipfile
    from pathlib import Path

    data = await file.read()
    ATTACH_DIR = Path("/data/attachments")

    is_zip = data[:4] == b"PK\x03\x04"
    is_sqlite = data.startswith(b"SQLite format 3\x00")

    if is_zip:
        try:
            zf = zipfile.ZipFile(io.BytesIO(data))
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid ZIP file.")
        names = zf.namelist()
        if "elementa.db" not in names:
            raise HTTPException(status_code=400, detail="ZIP does not contain elementa.db.")
        db_bytes = zf.read("elementa.db")
        _restore_db_bytes(db_bytes)
        # Restore attachments
        shutil.rmtree(ATTACH_DIR, ignore_errors=True)
        ATTACH_DIR.mkdir(parents=True, exist_ok=True)
        if "attachment_manifest.json" in names:
            manifest = json.loads(zf.read("attachment_manifest.json").decode())
            for arc_name, filename in manifest.items():
                if arc_name in names:
                    (ATTACH_DIR / filename).write_bytes(zf.read(arc_name))
        else:
            # Legacy: files directly in attachments/
            for entry in [n for n in names if n.startswith("attachments/") and not n.endswith("/")]:
                rel = entry[len("attachments/"):]
                dest = ATTACH_DIR / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(zf.read(entry))
    elif is_sqlite:
        _restore_db_bytes(data)
    else:
        raise HTTPException(status_code=400, detail="File must be an Elementa backup ZIP or a raw SQLite .db file.")

    return {"ok": True, "message": "Database restored. Please refresh the page."}
