from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.dependencies import get_current_user, get_db
from app.routers import auth, users, ngs, setup, admin
from app.routers import extraction_runs, pcr_runs, sanger_runs, library_prep_runs
from app.routers import export, attachments, protocols


def create_tables():
    import app.models  # noqa: ensure all models are registered
    Base.metadata.create_all(bind=engine)


def migrate_db():
    """Add columns introduced after initial schema without wiping the DB."""
    from sqlalchemy import text
    migrations = [
        ("extraction_runs", "container_type", "ALTER TABLE extraction_runs ADD COLUMN container_type VARCHAR(50)"),
        ("extractions", "position", "ALTER TABLE extractions ADD COLUMN position VARCHAR(10)"),
        ("extractions", "qc_status", "ALTER TABLE extractions ADD COLUMN qc_status VARCHAR(20)"),
        ("pcr_samples", "qc_status", "ALTER TABLE pcr_samples ADD COLUMN qc_status VARCHAR(20)"),
        ("sanger_samples", "qc_status", "ALTER TABLE sanger_samples ADD COLUMN qc_status VARCHAR(20)"),
        ("library_preps", "qc_status", "ALTER TABLE library_preps ADD COLUMN qc_status VARCHAR(20)"),
        ("ngs_run_libraries", "qc_status", "ALTER TABLE ngs_run_libraries ADD COLUMN qc_status VARCHAR(20)"),
        ("ngs_run_libraries", "reads_millions", "ALTER TABLE ngs_run_libraries ADD COLUMN reads_millions FLOAT"),
        ("extractions", "sample_type", "ALTER TABLE extractions ADD COLUMN sample_type VARCHAR(30)"),
        ("pcr_samples", "sample_type", "ALTER TABLE pcr_samples ADD COLUMN sample_type VARCHAR(30)"),
        ("sanger_samples", "sample_type", "ALTER TABLE sanger_samples ADD COLUMN sample_type VARCHAR(30)"),
        ("library_preps", "sample_type", "ALTER TABLE library_preps ADD COLUMN sample_type VARCHAR(30)"),
        ("users", "avatar_filename", "ALTER TABLE users ADD COLUMN avatar_filename VARCHAR(200)"),
        ("extraction_runs", "protocol_id", "ALTER TABLE extraction_runs ADD COLUMN protocol_id INTEGER REFERENCES protocols(id)"),
        ("pcr_runs", "protocol_id", "ALTER TABLE pcr_runs ADD COLUMN protocol_id INTEGER REFERENCES protocols(id)"),
        ("sanger_runs", "protocol_id", "ALTER TABLE sanger_runs ADD COLUMN protocol_id INTEGER REFERENCES protocols(id)"),
        ("library_prep_runs", "protocol_id", "ALTER TABLE library_prep_runs ADD COLUMN protocol_id INTEGER REFERENCES protocols(id)"),
        ("ngs_runs", "protocol_id", "ALTER TABLE ngs_runs ADD COLUMN protocol_id INTEGER REFERENCES protocols(id)"),
    ]
    with engine.connect() as conn:
        for table, column, sql in migrations:
            rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
            existing = [r[1] for r in rows]
            if column not in existing:
                conn.execute(text(sql))
        conn.commit()


def seed_admin():
    from app.models.user import User
    from app.security import hash_password

    db = SessionLocal()
    try:
        # Only seed on a completely empty database so restarts never re-trigger setup
        if db.query(User).count() == 0:
            admin = User(
                username=settings.FIRST_ADMIN_USERNAME,
                email=settings.FIRST_ADMIN_EMAIL,
                hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
                is_admin=True,
                is_active=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    migrate_db()
    seed_admin()
    yield


app = FastAPI(title="Elementa", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(setup.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(extraction_runs.router)
app.include_router(pcr_runs.router)
app.include_router(sanger_runs.router)
app.include_router(library_prep_runs.router)
app.include_router(ngs.router)
app.include_router(protocols.router)
app.include_router(export.router)
app.include_router(attachments.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/stats")
def stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.models.extraction_run import ExtractionRun, Extraction
    from app.models.pcr_run import PCRRun, PCRSample
    from app.models.sanger_run import SangerRun, SangerSample
    from app.models.library_prep_run import LibraryPrepRun, LibraryPrep
    from app.models.ngs_run import NGSRun

    return {
        "extraction_runs": db.query(ExtractionRun).count(),
        "extractions": db.query(Extraction).count(),
        "pcr_runs": db.query(PCRRun).count(),
        "pcr_samples": db.query(PCRSample).count(),
        "sanger_runs": db.query(SangerRun).count(),
        "sanger_samples": db.query(SangerSample).count(),
        "library_prep_runs": db.query(LibraryPrepRun).count(),
        "library_preps": db.query(LibraryPrep).count(),
        "ngs_runs": db.query(NGSRun).count(),
    }
