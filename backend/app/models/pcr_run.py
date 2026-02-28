from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.extraction_run import Extraction
    from app.models.protocol import Protocol


class PCRRun(Base):
    __tablename__ = "pcr_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    protocol_id: Mapped[Optional[int]] = mapped_column(ForeignKey("protocols.id"), nullable=True)
    target_region: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    primer_f: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    primer_r: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    annealing_temp_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cycles: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    polymerase: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    amplicon_size_bp: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    operator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[operator_id])
    protocol: Mapped[Optional["Protocol"]] = relationship("Protocol", foreign_keys=[protocol_id])
    samples: Mapped[list["PCRSample"]] = relationship(
        "PCRSample", back_populates="run", cascade="all, delete-orphan"
    )


class PCRSample(Base):
    __tablename__ = "pcr_samples"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("pcr_runs.id"), nullable=False)
    extraction_id: Mapped[Optional[int]] = mapped_column(ForeignKey("extractions.id"), nullable=True)
    specimen_code: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    gel_result: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    qc_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sample_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    run: Mapped["PCRRun"] = relationship("PCRRun", back_populates="samples")
    extraction: Mapped[Optional["Extraction"]] = relationship("Extraction", foreign_keys=[extraction_id])
