from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ── Individual Primers ────────────────────────────────────────────

class PrimerCreate(BaseModel):
    name: str
    sequence: Optional[str] = None
    direction: Optional[str] = None
    target_taxa: Optional[str] = None
    target_gene: Optional[str] = None
    annealing_temp_c: Optional[float] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class PrimerUpdate(BaseModel):
    name: Optional[str] = None
    sequence: Optional[str] = None
    direction: Optional[str] = None
    target_taxa: Optional[str] = None
    target_gene: Optional[str] = None
    annealing_temp_c: Optional[float] = None
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
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Primer Pairs ──────────────────────────────────────────────────

class PrimerInPair(BaseModel):
    id: int
    name: str
    sequence: Optional[str] = None
    direction: Optional[str] = None

    class Config:
        from_attributes = True


class PrimerPairCreate(BaseModel):
    name: Optional[str] = None
    forward_primer_id: Optional[int] = None
    reverse_primer_id: Optional[int] = None
    amplicon_size_bp: Optional[int] = None
    annealing_temp_c: Optional[float] = None
    target_gene: Optional[str] = None
    target_taxa: Optional[str] = None
    notes: Optional[str] = None
    reference: Optional[str] = None


class PrimerPairUpdate(BaseModel):
    name: Optional[str] = None
    forward_primer_id: Optional[int] = None
    reverse_primer_id: Optional[int] = None
    amplicon_size_bp: Optional[int] = None
    annealing_temp_c: Optional[float] = None
    target_gene: Optional[str] = None
    target_taxa: Optional[str] = None
    notes: Optional[str] = None
    reference: Optional[str] = None


class PrimerPairRead(BaseModel):
    id: int
    name: Optional[str] = None
    forward_primer_id: Optional[int] = None
    reverse_primer_id: Optional[int] = None
    forward_primer: Optional[PrimerInPair] = None
    reverse_primer: Optional[PrimerInPair] = None
    amplicon_size_bp: Optional[int] = None
    annealing_temp_c: Optional[float] = None
    target_gene: Optional[str] = None
    target_taxa: Optional[str] = None
    notes: Optional[str] = None
    reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
