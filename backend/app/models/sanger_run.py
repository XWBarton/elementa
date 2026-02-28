from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.pcr_run import PCRSample
    from app.models.protocol import Protocol


class SangerRun(Base):
    __tablename__ = "sanger_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    protocol_id: Mapped[Optional[int]] = mapped_column(ForeignKey("protocols.id"), nullable=True)
    primer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    direction: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    service_provider: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    order_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    operator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[operator_id])
    protocol: Mapped[Optional["Protocol"]] = relationship("Protocol", foreign_keys=[protocol_id])
    samples: Mapped[list["SangerSample"]] = relationship(
        "SangerSample", back_populates="run", cascade="all, delete-orphan"
    )


class SangerSample(Base):
    __tablename__ = "sanger_samples"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("sanger_runs.id"), nullable=False)
    pcr_sample_id: Mapped[Optional[int]] = mapped_column(ForeignKey("pcr_samples.id"), nullable=True)
    specimen_code: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    sequence_length_bp: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    output_file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    quality_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qc_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sample_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    run: Mapped["SangerRun"] = relationship("SangerRun", back_populates="samples")
    pcr_sample: Mapped[Optional["PCRSample"]] = relationship("PCRSample", foreign_keys=[pcr_sample_id])
