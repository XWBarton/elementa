from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.protocol import Protocol


class NGSRun(Base):
    __tablename__ = "ngs_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # Illumina|ONT|PacBio|Other
    instrument: Mapped[Optional[str]] = mapped_column(String(200))
    run_id: Mapped[Optional[str]] = mapped_column(String(200))
    date: Mapped[Optional[date]] = mapped_column(Date)
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    protocol_id: Mapped[Optional[int]] = mapped_column(ForeignKey("protocols.id"), nullable=True)
    flow_cell_id: Mapped[Optional[str]] = mapped_column(String(200))
    reagent_kit: Mapped[Optional[str]] = mapped_column(String(200))
    output_path: Mapped[Optional[str]] = mapped_column(String(500))
    total_reads: Mapped[Optional[int]] = mapped_column(Integer)
    q30_percent: Mapped[Optional[float]] = mapped_column(Float)
    mean_read_length_bp: Mapped[Optional[int]] = mapped_column(Integer)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    operator = relationship("User", foreign_keys=[operator_id])
    protocol: Mapped[Optional["Protocol"]] = relationship("Protocol", foreign_keys=[protocol_id])
    libraries = relationship("NGSRunLibrary", back_populates="ngs_run", cascade="all, delete-orphan")


class NGSRunLibrary(Base):
    __tablename__ = "ngs_run_libraries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ngs_run_id: Mapped[int] = mapped_column(ForeignKey("ngs_runs.id"), nullable=False)
    library_prep_id: Mapped[Optional[int]] = mapped_column(ForeignKey("library_preps.id"), nullable=True)
    specimen_code: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    sample_name: Mapped[Optional[str]] = mapped_column(String(200))
    qc_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    reads_millions: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    ngs_run = relationship("NGSRun", back_populates="libraries")
    library_prep = relationship("LibraryPrep", back_populates="ngs_run_libraries")
