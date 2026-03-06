from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Integer, String, Float, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
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
    product_size_bp: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
