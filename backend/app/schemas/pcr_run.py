from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user import UserRead
from app.schemas.extraction_run import ExtractionRead
from app.schemas.protocol import ProtocolRead
from app.schemas.project import ProjectRead


class PCRSampleCreate(BaseModel):
    extraction_id: Optional[int] = None
    specimen_code: Optional[str] = None
    gel_result: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None


class PCRSampleUpdate(BaseModel):
    extraction_id: Optional[int] = None
    specimen_code: Optional[str] = None
    gel_result: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None


class PCRSampleRead(BaseModel):
    id: int
    run_id: int
    extraction_id: Optional[int] = None
    extraction: Optional[ExtractionRead] = None
    specimen_code: Optional[str] = None
    gel_result: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class PCRRunCreate(BaseModel):
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    protocol_id: Optional[int] = None
    project_id: Optional[int] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    annealing_temp_c: Optional[float] = None
    cycles: Optional[int] = None
    polymerase: Optional[str] = None
    amplicon_size_bp: Optional[int] = None
    notes: Optional[str] = None


class PCRRunUpdate(BaseModel):
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    protocol_id: Optional[int] = None
    project_id: Optional[int] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    annealing_temp_c: Optional[float] = None
    cycles: Optional[int] = None
    polymerase: Optional[str] = None
    amplicon_size_bp: Optional[int] = None
    notes: Optional[str] = None


class PCRRunRead(BaseModel):
    id: int
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    operator: Optional[UserRead] = None
    protocol_id: Optional[int] = None
    protocol: Optional[ProtocolRead] = None
    project_id: Optional[int] = None
    project: Optional[ProjectRead] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    annealing_temp_c: Optional[float] = None
    cycles: Optional[int] = None
    polymerase: Optional[str] = None
    amplicon_size_bp: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    sample_count: int = 0

    class Config:
        from_attributes = True


class PCRRunDetail(PCRRunRead):
    samples: List[PCRSampleRead] = []
