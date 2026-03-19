from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class PrimerPairRead(BaseModel):
    id: int
    name: str
    direction: Optional[str] = None

    class Config:
        from_attributes = True


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
    pair_ids: List[int] = []


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
    pair_ids: Optional[List[int]] = None


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
    pairs: List[PrimerPairRead] = []
    created_at: datetime

    class Config:
        from_attributes = True
