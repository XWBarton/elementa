from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Table, Column, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.extraction_run import Extraction
    from app.models.pcr_run import PCRSample
    from app.models.protocol import Protocol
    from app.models.project import Project
    from app.models.primer import PrimerPair


library_prep_run_primer_pairs = Table(
    "library_prep_run_primer_pairs",
    Base.metadata,
    Column("library_prep_run_id", Integer, ForeignKey("library_prep_runs.id", ondelete="CASCADE"), primary_key=True),
    Column("primer_pair_id", Integer, ForeignKey("primer_pair_records.id", ondelete="CASCADE"), primary_key=True),
)


class LibraryPrepRun(Base):
    __tablename__ = "library_prep_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    protocol_id: Mapped[Optional[int]] = mapped_column(ForeignKey("protocols.id"), nullable=True)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True)
    kit: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    target_region: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    primer_f: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    primer_r: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    primer_pair_id: Mapped[Optional[int]] = mapped_column(ForeignKey("primer_pair_records.id"), nullable=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    operator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[operator_id])
    protocol: Mapped[Optional["Protocol"]] = relationship("Protocol", foreign_keys=[protocol_id])
    project: Mapped[Optional["Project"]] = relationship("Project", foreign_keys=[project_id])
    primer_pair: Mapped[Optional["PrimerPair"]] = relationship("PrimerPair", foreign_keys=[primer_pair_id])
    primer_pairs: Mapped[List["PrimerPair"]] = relationship(
        "PrimerPair", secondary=library_prep_run_primer_pairs, lazy="select"
    )
    samples: Mapped[list["LibraryPrep"]] = relationship(
        "LibraryPrep", back_populates="run", cascade="all, delete-orphan"
    )


class LibraryPrep(Base):
    __tablename__ = "library_preps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("library_prep_runs.id"), nullable=False)
    extraction_id: Mapped[Optional[int]] = mapped_column(ForeignKey("extractions.id"), nullable=True)
    pcr_sample_id: Mapped[Optional[int]] = mapped_column(ForeignKey("pcr_samples.id"), nullable=True)
    specimen_code: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    index_i7: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    index_i5: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    input_ng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_fragment_size_bp: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    library_concentration_ng_ul: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sample_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    qc_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sample_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    run: Mapped["LibraryPrepRun"] = relationship("LibraryPrepRun", back_populates="samples")
    extraction: Mapped[Optional["Extraction"]] = relationship("Extraction", foreign_keys=[extraction_id])
    pcr_sample: Mapped[Optional["PCRSample"]] = relationship("PCRSample", foreign_keys=[pcr_sample_id])
    ngs_run_libraries = relationship("NGSRunLibrary", back_populates="library_prep", cascade="all, delete-orphan")
