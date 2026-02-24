from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user import UserRead
from app.schemas.extraction_run import ExtractionRead


class LibraryPrepCreate(BaseModel):
    extraction_id: Optional[int] = None
    specimen_code: Optional[str] = None
    index_i7: Optional[str] = None
    index_i5: Optional[str] = None
    input_ng: Optional[float] = None
    average_fragment_size_bp: Optional[int] = None
    library_concentration_ng_ul: Optional[float] = None
    sample_name: Optional[str] = None
    notes: Optional[str] = None


class LibraryPrepUpdate(BaseModel):
    extraction_id: Optional[int] = None
    specimen_code: Optional[str] = None
    index_i7: Optional[str] = None
    index_i5: Optional[str] = None
    input_ng: Optional[float] = None
    average_fragment_size_bp: Optional[int] = None
    library_concentration_ng_ul: Optional[float] = None
    sample_name: Optional[str] = None
    notes: Optional[str] = None


class LibraryPrepRead(BaseModel):
    id: int
    run_id: int
    extraction_id: Optional[int] = None
    extraction: Optional[ExtractionRead] = None
    specimen_code: Optional[str] = None
    index_i7: Optional[str] = None
    index_i5: Optional[str] = None
    input_ng: Optional[float] = None
    average_fragment_size_bp: Optional[int] = None
    library_concentration_ng_ul: Optional[float] = None
    sample_name: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class LibraryPrepRunCreate(BaseModel):
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    kit: Optional[str] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    notes: Optional[str] = None


class LibraryPrepRunUpdate(BaseModel):
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    kit: Optional[str] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    notes: Optional[str] = None


class LibraryPrepRunRead(BaseModel):
    id: int
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    operator: Optional[UserRead] = None
    kit: Optional[str] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    sample_count: int = 0

    class Config:
        from_attributes = True


class LibraryPrepRunDetail(LibraryPrepRunRead):
    samples: List[LibraryPrepRead] = []
