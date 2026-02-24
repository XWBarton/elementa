from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PCRReaction(Base):
    __tablename__ = "pcr_reactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    extraction_id: Mapped[int] = mapped_column(ForeignKey("extractions.id"), nullable=False, index=True)
    date: Mapped[Optional[date]] = mapped_column(Date)
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    target_region: Mapped[Optional[str]] = mapped_column(String(200))
    primer_f: Mapped[Optional[str]] = mapped_column(String(200))
    primer_r: Mapped[Optional[str]] = mapped_column(String(200))
    annealing_temp_c: Mapped[Optional[float]] = mapped_column(Float)
    cycles: Mapped[Optional[int]] = mapped_column(Integer)
    polymerase: Mapped[Optional[str]] = mapped_column(String(200))
    amplicon_size_bp: Mapped[Optional[int]] = mapped_column(Integer)
    gel_result: Mapped[Optional[str]] = mapped_column(String(50))  # pass|fail|weak|multiple_bands
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    extraction = relationship("Extraction", back_populates="pcr_reactions")
    operator = relationship("User", foreign_keys=[operator_id])
    sanger_runs = relationship("SangerRun", back_populates="pcr_reaction", cascade="all, delete-orphan")
