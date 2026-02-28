from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RunAttachment(Base):
    __tablename__ = "run_attachments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    run_type: Mapped[str] = mapped_column(String(30), nullable=False)  # extraction|pcr|sanger|library_prep|ngs
    run_id: Mapped[int] = mapped_column(Integer, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    caption: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    uploaded_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
