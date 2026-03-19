from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import Integer, String, Float, Text, DateTime, Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


primer_pairs = Table(
    "primer_pairs",
    Base.metadata,
    Column("primer_id", Integer, ForeignKey("primers.id", ondelete="CASCADE"), primary_key=True),
    Column("paired_primer_id", Integer, ForeignKey("primers.id", ondelete="CASCADE"), primary_key=True),
)


class Primer(Base):
    __tablename__ = "primers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    sequence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    direction: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)   # F / R
    target_taxa: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    target_gene: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    annealing_temp_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    product_size_bp: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    pairs: Mapped[List[Primer]] = relationship(
        "Primer",
        secondary=primer_pairs,
        primaryjoin=id == primer_pairs.c.primer_id,
        secondaryjoin=id == primer_pairs.c.paired_primer_id,
    )
