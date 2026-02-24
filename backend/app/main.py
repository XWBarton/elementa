from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.dependencies import get_current_user, get_db
from app.routers import auth, users, ngs
from app.routers import extraction_runs, pcr_runs, sanger_runs, library_prep_runs
from app.routers import export


def create_tables():
    import app.models  # noqa: ensure all models are registered
    Base.metadata.create_all(bind=engine)


def seed_admin():
    from app.models.user import User
    from app.security import hash_password

    db = SessionLocal()
    try:
        exists = db.query(User).filter(User.username == settings.FIRST_ADMIN_USERNAME).first()
        if not exists:
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
    seed_admin()
    yield


app = FastAPI(title="Elementa LIMS", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(extraction_runs.router)
app.include_router(pcr_runs.router)
app.include_router(sanger_runs.router)
app.include_router(library_prep_runs.router)
app.include_router(ngs.router)
app.include_router(export.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


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
