from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user import UserRead
from app.schemas.extraction_run import ExtractionRead
from app.schemas.pcr_run import PCRSampleRead
from app.schemas.protocol import ProtocolRead
from app.schemas.project import ProjectRead
from app.schemas.primer import PrimerPairRead


class BulkSpecimenCodePayload(BaseModel):
    specimen_codes: list[str]


class LibraryPrepCreate(BaseModel):
    extraction_id: Optional[int] = None
    pcr_sample_id: Optional[int] = None
    specimen_code: Optional[str] = None
    index_i7: Optional[str] = None
    index_i5: Optional[str] = None
    input_ng: Optional[float] = None
    average_fragment_size_bp: Optional[int] = None
    library_concentration_ng_ul: Optional[float] = None
    sample_name: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None


class LibraryPrepUpdate(BaseModel):
    extraction_id: Optional[int] = None
    pcr_sample_id: Optional[int] = None
    specimen_code: Optional[str] = None
    index_i7: Optional[str] = None
    index_i5: Optional[str] = None
    input_ng: Optional[float] = None
    average_fragment_size_bp: Optional[int] = None
    library_concentration_ng_ul: Optional[float] = None
    sample_name: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None


class LibraryPrepRead(BaseModel):
    id: int
    run_id: int
    extraction_id: Optional[int] = None
    extraction: Optional[ExtractionRead] = None
    pcr_sample_id: Optional[int] = None
    pcr_sample: Optional[PCRSampleRead] = None
    specimen_code: Optional[str] = None
    index_i7: Optional[str] = None
    index_i5: Optional[str] = None
    input_ng: Optional[float] = None
    average_fragment_size_bp: Optional[int] = None
    library_concentration_ng_ul: Optional[float] = None
    sample_name: Optional[str] = None
    qc_status: Optional[str] = None
    sample_type: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class LibraryPrepRunCreate(BaseModel):
    run_date: Optional[date] = None
    operator_id: int
    project_id: int
    protocol_id: Optional[int] = None
    kit: Optional[str] = None
    target_region: Optional[str] = None
    primer_pair_ids: Optional[List[int]] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    notes: Optional[str] = None


class LibraryPrepRunUpdate(BaseModel):
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    protocol_id: Optional[int] = None
    project_id: Optional[int] = None
    kit: Optional[str] = None
    target_region: Optional[str] = None
    primer_pair_ids: Optional[List[int]] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    notes: Optional[str] = None


class LibraryPrepRunRead(BaseModel):
    id: int
    run_date: Optional[date] = None
    operator_id: Optional[int] = None
    operator: Optional[UserRead] = None
    protocol_id: Optional[int] = None
    protocol: Optional[ProtocolRead] = None
    project_id: Optional[int] = None
    project: Optional[ProjectRead] = None
    kit: Optional[str] = None
    target_region: Optional[str] = None
    primer_pairs: List[PrimerPairRead] = []
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    notes: Optional[str] = None
    is_locked: bool = False
    created_at: datetime
    sample_count: int = 0

    class Config:
        from_attributes = True


class LibraryPrepRunDetail(LibraryPrepRunRead):
    samples: List[LibraryPrepRead] = []
