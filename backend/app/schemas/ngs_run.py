from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user import UserRead
from app.schemas.library_prep_run import LibraryPrepRead
from app.schemas.protocol import ProtocolRead


class NGSRunLibraryCreate(BaseModel):
    library_prep_id: Optional[int] = None
    specimen_code: Optional[str] = None
    sample_name: Optional[str] = None
    qc_status: Optional[str] = None
    reads_millions: Optional[float] = None


class NGSRunLibraryRead(BaseModel):
    id: int
    ngs_run_id: int
    library_prep_id: Optional[int] = None
    specimen_code: Optional[str] = None
    sample_name: Optional[str] = None
    qc_status: Optional[str] = None
    reads_millions: Optional[float] = None
    library_prep: Optional[LibraryPrepRead] = None

    class Config:
        from_attributes = True


class NGSRunCreate(BaseModel):
    platform: str
    instrument: Optional[str] = None
    run_id: Optional[str] = None
    date: Optional[date] = None
    operator_id: Optional[int] = None
    protocol_id: Optional[int] = None
    flow_cell_id: Optional[str] = None
    reagent_kit: Optional[str] = None
    output_path: Optional[str] = None
    total_reads: Optional[int] = None
    q30_percent: Optional[float] = None
    mean_read_length_bp: Optional[int] = None
    notes: Optional[str] = None
    libraries: List[NGSRunLibraryCreate] = []


class NGSRunUpdate(BaseModel):
    platform: Optional[str] = None
    instrument: Optional[str] = None
    run_id: Optional[str] = None
    date: Optional[date] = None
    operator_id: Optional[int] = None
    protocol_id: Optional[int] = None
    flow_cell_id: Optional[str] = None
    reagent_kit: Optional[str] = None
    output_path: Optional[str] = None
    total_reads: Optional[int] = None
    q30_percent: Optional[float] = None
    mean_read_length_bp: Optional[int] = None
    notes: Optional[str] = None
    libraries: Optional[List[NGSRunLibraryCreate]] = None


class NGSRunRead(BaseModel):
    id: int
    platform: str
    instrument: Optional[str] = None
    run_id: Optional[str] = None
    date: Optional[date] = None
    operator_id: Optional[int] = None
    operator: Optional[UserRead] = None
    protocol_id: Optional[int] = None
    protocol: Optional[ProtocolRead] = None
    flow_cell_id: Optional[str] = None
    reagent_kit: Optional[str] = None
    output_path: Optional[str] = None
    total_reads: Optional[int] = None
    q30_percent: Optional[float] = None
    mean_read_length_bp: Optional[int] = None
    notes: Optional[str] = None
    libraries: List[NGSRunLibraryRead] = []
    created_at: datetime

    class Config:
        from_attributes = True
