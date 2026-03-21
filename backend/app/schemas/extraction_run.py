from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, field_validator

from app.schemas.user import UserRead
from app.schemas.protocol import ProtocolRead
from app.schemas.project import ProjectRead


class BulkSpecimenCodePayload(BaseModel):
    specimen_codes: List[str]

    @field_validator("specimen_codes")
    @classmethod
    def codes_not_empty(cls, v: List[str]) -> List[str]:
        if not isinstance(v, list):
            raise ValueError("specimen_codes must be a list")
        return [c for c in v if c and c.strip()]


class ExtractionCreate(BaseModel):
    specimen_code: str
    position: Optional[str] = None
    input_quantity: Optional[float] = None
    input_quantity_unit: Optional[str] = None
    yield_ng_ul: Optional[float] = None
    a260_280: Optional[float] = None
    a260_230: Optional[float] = None
    rin_score: Optional[float] = None
    storage_location: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None


class ExtractionUpdate(BaseModel):
    specimen_code: Optional[str] = None
    position: Optional[str] = None
    input_quantity: Optional[float] = None
    input_quantity_unit: Optional[str] = None
    yield_ng_ul: Optional[float] = None
    a260_280: Optional[float] = None
    a260_230: Optional[float] = None
    rin_score: Optional[float] = None
    storage_location: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None


class ExtractionRead(BaseModel):
    id: int
    run_id: int
    specimen_code: str
    position: Optional[str] = None
    input_quantity: Optional[float] = None
    input_quantity_unit: Optional[str] = None
    yield_ng_ul: Optional[float] = None
    a260_280: Optional[float] = None
    a260_230: Optional[float] = None
    rin_score: Optional[float] = None
    storage_location: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ExtractionRunCreate(BaseModel):
    run_date: Optional[date] = None
    operator_id: int
    project_id: int
    protocol_id: Optional[int] = None
    kit: Optional[str] = None
    extraction_type: Optional[str] = None
    container_type: Optional[str] = None
    elution_volume_ul: Optional[float] = None
    protocol_notes: Optional[str] = None
    notes: Optional[str] = None


class ExtractionRunUpdate(BaseModel):
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    protocol_id: Optional[int] = None
    project_id: Optional[int] = None
    kit: Optional[str] = None
    extraction_type: Optional[str] = None
    container_type: Optional[str] = None
    elution_volume_ul: Optional[float] = None
    protocol_notes: Optional[str] = None
    notes: Optional[str] = None


class ExtractionRunRead(BaseModel):
    id: int
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    operator: Optional[UserRead] = None
    protocol_id: Optional[int] = None
    protocol: Optional[ProtocolRead] = None
    project_id: Optional[int] = None
    project: Optional[ProjectRead] = None
    kit: Optional[str] = None
    extraction_type: Optional[str] = None
    container_type: Optional[str] = None
    elution_volume_ul: Optional[float] = None
    protocol_notes: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    sample_count: int = 0

    class Config:
        from_attributes = True


class ExtractionRunDetail(ExtractionRunRead):
    samples: List[ExtractionRead] = []
