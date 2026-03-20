from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Primer(Base):
    __tablename__ = "primers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    sequence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    direction: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)   # F / R
    target_taxa: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    target_gene: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    annealing_temp_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class PrimerPair(Base):
    __tablename__ = "primer_pair_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    forward_primer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("primers.id", ondelete="SET NULL"), nullable=True
    )
    reverse_primer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("primers.id", ondelete="SET NULL"), nullable=True
    )
    amplicon_size_bp: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    annealing_temp_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_gene: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    target_taxa: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    forward_primer: Mapped[Optional[Primer]] = relationship("Primer", foreign_keys=[forward_primer_id])
    reverse_primer: Mapped[Optional[Primer]] = relationship("Primer", foreign_keys=[reverse_primer_id])
