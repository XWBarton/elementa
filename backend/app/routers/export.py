import csv
import io
import sqlite3
from datetime import datetime, timezone

from fastapi import Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

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
    from app.models.extraction_run import Extraction

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
    from app.models.extraction_run import Extraction

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
    from app.models.extraction_run import Extraction

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
    from app.models.extraction_run import Extraction

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


# ── database backup ───────────────────────────────────────────────────────────

@router.get("/backup")
def download_backup(_=Depends(require_admin)):
    db_path = settings.DATABASE_URL.replace("sqlite:///", "", 1)
    conn = sqlite3.connect(db_path)
    data = conn.serialize()
    conn.close()
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M")
    filename = f"elementa_backup_{timestamp}.db"
    return StreamingResponse(
        iter([data]),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
