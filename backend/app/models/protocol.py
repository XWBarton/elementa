from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Protocol(Base):
    __tablename__ = "protocols"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    steps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    materials: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    created_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by_id])
