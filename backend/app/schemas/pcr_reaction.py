from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserRead


class PCRBase(BaseModel):
    extraction_id: int
    date: Optional[date] = None
    operator_id: Optional[int] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    annealing_temp_c: Optional[float] = None
    cycles: Optional[int] = None
    polymerase: Optional[str] = None
    amplicon_size_bp: Optional[int] = None
    gel_result: Optional[str] = None
    notes: Optional[str] = None


class PCRCreate(PCRBase):
    pass


class PCRUpdate(BaseModel):
    date: Optional[date] = None
    operator_id: Optional[int] = None
    target_region: Optional[str] = None
    primer_f: Optional[str] = None
    primer_r: Optional[str] = None
    annealing_temp_c: Optional[float] = None
    cycles: Optional[int] = None
    polymerase: Optional[str] = None
    amplicon_size_bp: Optional[int] = None
    gel_result: Optional[str] = None
    notes: Optional[str] = None


class PCRRead(PCRBase):
    id: int
    operator: Optional[UserRead] = None
    created_at: datetime

    class Config:
        from_attributes = True
