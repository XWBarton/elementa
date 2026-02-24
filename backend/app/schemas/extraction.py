from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserRead


class ExtractionBase(BaseModel):
    specimen_code: str
    tessera_usage_ref: Optional[str] = None
    extraction_type: str
    date: Optional[date] = None
    operator_id: Optional[int] = None
    kit: Optional[str] = None
    protocol_notes: Optional[str] = None
    input_quantity: Optional[float] = None
    input_quantity_unit: Optional[str] = None
    elution_volume_ul: Optional[float] = None
    yield_ng_ul: Optional[float] = None
    a260_280: Optional[float] = None
    a260_230: Optional[float] = None
    rin_score: Optional[float] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None


class ExtractionCreate(ExtractionBase):
    pass


class ExtractionUpdate(BaseModel):
    specimen_code: Optional[str] = None
    tessera_usage_ref: Optional[str] = None
    extraction_type: Optional[str] = None
    date: Optional[date] = None
    operator_id: Optional[int] = None
    kit: Optional[str] = None
    protocol_notes: Optional[str] = None
    input_quantity: Optional[float] = None
    input_quantity_unit: Optional[str] = None
    elution_volume_ul: Optional[float] = None
    yield_ng_ul: Optional[float] = None
    a260_280: Optional[float] = None
    a260_230: Optional[float] = None
    rin_score: Optional[float] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None


class ExtractionRead(ExtractionBase):
    id: int
    operator: Optional[UserRead] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
