from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LibraryPrep(Base):
    __tablename__ = "library_preps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    extraction_id: Mapped[int] = mapped_column(ForeignKey("extractions.id"), nullable=False, index=True)
    date: Mapped[Optional[date]] = mapped_column(Date)
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    kit: Mapped[Optional[str]] = mapped_column(String(200))
    target_region: Mapped[Optional[str]] = mapped_column(String(200))
    primer_f: Mapped[Optional[str]] = mapped_column(String(200))
    primer_r: Mapped[Optional[str]] = mapped_column(String(200))
    index_i7: Mapped[Optional[str]] = mapped_column(String(100))
    index_i5: Mapped[Optional[str]] = mapped_column(String(100))
    input_ng: Mapped[Optional[float]] = mapped_column(Float)
    average_fragment_size_bp: Mapped[Optional[int]] = mapped_column(Integer)
    library_concentration_ng_ul: Mapped[Optional[float]] = mapped_column(Float)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    extraction = relationship("Extraction", back_populates="library_preps")
    operator = relationship("User", foreign_keys=[operator_id])
    ngs_run_libraries = relationship("NGSRunLibrary", back_populates="library_prep", cascade="all, delete-orphan")
