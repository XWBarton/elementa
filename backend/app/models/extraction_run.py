from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.protocol import Protocol
    from app.models.project import Project


class ExtractionRun(Base):
    __tablename__ = "extraction_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    protocol_id: Mapped[Optional[int]] = mapped_column(ForeignKey("protocols.id"), nullable=True)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True)
    kit: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    extraction_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    container_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    elution_volume_ul: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    protocol_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    operator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[operator_id])
    protocol: Mapped[Optional["Protocol"]] = relationship("Protocol", foreign_keys=[protocol_id])
    project: Mapped[Optional["Project"]] = relationship("Project", foreign_keys=[project_id])
    samples: Mapped[list["Extraction"]] = relationship(
        "Extraction", back_populates="run", cascade="all, delete-orphan"
    )


class Extraction(Base):
    __tablename__ = "extractions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("extraction_runs.id"), nullable=False)
    specimen_code: Mapped[str] = mapped_column(String(100), index=True)
    position: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    input_quantity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    input_quantity_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    yield_ng_ul: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    a260_280: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    a260_230: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rin_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    storage_location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    qc_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sample_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    run: Mapped["ExtractionRun"] = relationship("ExtractionRun", back_populates="samples")
