from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PrimerCreate(BaseModel):
    name: str
    sequence: Optional[str] = None
    direction: Optional[str] = None
    target_taxa: Optional[str] = None
    target_gene: Optional[str] = None
    annealing_temp_c: Optional[float] = None
    product_size_bp: Optional[int] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class PrimerUpdate(BaseModel):
    name: Optional[str] = None
    sequence: Optional[str] = None
    direction: Optional[str] = None
    target_taxa: Optional[str] = None
    target_gene: Optional[str] = None
    annealing_temp_c: Optional[float] = None
    product_size_bp: Optional[int] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class PrimerRead(BaseModel):
    id: int
    name: str
    sequence: Optional[str] = None
    direction: Optional[str] = None
    target_taxa: Optional[str] = None
    target_gene: Optional[str] = None
    annealing_temp_c: Optional[float] = None
    product_size_bp: Optional[int] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
