from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Extraction(Base):
    __tablename__ = "extractions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    specimen_code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    tessera_usage_ref: Mapped[Optional[str]] = mapped_column(String(200))
    extraction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # DNA | RNA | Total Nucleic Acid
    date: Mapped[Optional[date]] = mapped_column(Date)
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    kit: Mapped[Optional[str]] = mapped_column(String(200))
    protocol_notes: Mapped[Optional[str]] = mapped_column(Text)
    input_quantity: Mapped[Optional[float]] = mapped_column(Float)
    input_quantity_unit: Mapped[Optional[str]] = mapped_column(String(50))
    elution_volume_ul: Mapped[Optional[float]] = mapped_column(Float)
    yield_ng_ul: Mapped[Optional[float]] = mapped_column(Float)
    a260_280: Mapped[Optional[float]] = mapped_column(Float)
    a260_230: Mapped[Optional[float]] = mapped_column(Float)
    rin_score: Mapped[Optional[float]] = mapped_column(Float)
    storage_location: Mapped[Optional[str]] = mapped_column(String(200))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    operator = relationship("User", foreign_keys=[operator_id])
    pcr_reactions = relationship("PCRReaction", back_populates="extraction", cascade="all, delete-orphan")
    library_preps = relationship("LibraryPrep", back_populates="extraction", cascade="all, delete-orphan")
