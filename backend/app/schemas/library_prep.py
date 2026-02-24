from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserRead


class LibraryPrepBase(BaseModel):
    extraction_id: int
    date: Optional[date] = None
    operator_id: Optional[int] = None
    kit: Optional[str] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    index_i7: Optional[str] = None
    index_i5: Optional[str] = None
    input_ng: Optional[float] = None
    average_fragment_size_bp: Optional[int] = None
    library_concentration_ng_ul: Optional[float] = None
    notes: Optional[str] = None


class LibraryPrepCreate(LibraryPrepBase):
    pass


class LibraryPrepUpdate(BaseModel):
    date: Optional[date] = None
    operator_id: Optional[int] = None
    kit: Optional[str] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    index_i7: Optional[str] = None
    index_i5: Optional[str] = None
    input_ng: Optional[float] = None
    average_fragment_size_bp: Optional[int] = None
    library_concentration_ng_ul: Optional[float] = None
    notes: Optional[str] = None


class LibraryPrepRead(LibraryPrepBase):
    id: int
    operator: Optional[UserRead] = None
    created_at: datetime

    class Config:
        from_attributes = True
