from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user import UserRead
from app.schemas.pcr_run import PCRSampleRead
from app.schemas.protocol import ProtocolRead
from app.schemas.project import ProjectRead
from app.schemas.primer import PrimerRead


class BulkSpecimenCodePayload(BaseModel):
    specimen_codes: list[str]


class SangerSampleCreate(BaseModel):
    pcr_sample_id: Optional[int] = None
    specimen_code: Optional[str] = None
    sequence: Optional[str] = None
    sequence_length_bp: Optional[int] = None
    output_file_path: Optional[str] = None
    quality_notes: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None


class SangerSampleUpdate(BaseModel):
    pcr_sample_id: Optional[int] = None
    specimen_code: Optional[str] = None
    sequence: Optional[str] = None
    sequence_length_bp: Optional[int] = None
    output_file_path: Optional[str] = None
    quality_notes: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None


class SangerSampleRead(BaseModel):
    id: int
    run_id: int
    pcr_sample_id: Optional[int] = None
    pcr_sample: Optional[PCRSampleRead] = None
    specimen_code: Optional[str] = None
    sequence: Optional[str] = None
    sequence_length_bp: Optional[int] = None
    output_file_path: Optional[str] = None
    quality_notes: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class SangerRunCreate(BaseModel):
    run_date: Optional[date] = None
    operator_id: int
    project_id: int
    protocol_id: Optional[int] = None
    primer_id: Optional[int] = None
    primer: Optional[str] = None
    direction: Optional[str] = None
    service_provider: Optional[str] = None
    order_id: Optional[str] = None
    notes: Optional[str] = None


class SangerRunUpdate(BaseModel):
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    protocol_id: Optional[int] = None
    project_id: Optional[int] = None
    primer_id: Optional[int] = None
    primer: Optional[str] = None
    direction: Optional[str] = None
    service_provider: Optional[str] = None
    order_id: Optional[str] = None
    notes: Optional[str] = None


class SangerRunRead(BaseModel):
    id: int
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    operator: Optional[UserRead] = None
    protocol_id: Optional[int] = None
    protocol: Optional[ProtocolRead] = None
    project_id: Optional[int] = None
    project: Optional[ProjectRead] = None
    primer_id: Optional[int] = None
    primer_record: Optional[PrimerRead] = None
    primer: Optional[str] = None
    direction: Optional[str] = None
    service_provider: Optional[str] = None
    order_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    sample_count: int = 0

    class Config:
        from_attributes = True


class SangerRunDetail(SangerRunRead):
    samples: List[SangerSampleRead] = []
