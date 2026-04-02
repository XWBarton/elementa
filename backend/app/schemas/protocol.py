import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, field_validator

from app.schemas.user import UserRead


class ProtocolCreate(BaseModel):
    name: str
    category: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[Dict[str, Any]]] = None
    materials: Optional[List[str]] = None
    references: Optional[List[Dict[str, str]]] = None
    notes: Optional[str] = None


class ProtocolUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[Dict[str, Any]]] = None
    materials: Optional[List[str]] = None
    references: Optional[List[Dict[str, str]]] = None
    notes: Optional[str] = None


class ProtocolRead(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[Dict[str, Any]]] = None
    materials: Optional[List[str]] = None
    references: Optional[List[Dict[str, str]]] = None
    notes: Optional[str] = None
    created_by_id: Optional[int] = None
    created_by: Optional[UserRead] = None
    created_at: datetime

    @field_validator("steps", mode="before")
    @classmethod
    def parse_steps(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator("materials", mode="before")
    @classmethod
    def parse_materials(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator("references", mode="before")
    @classmethod
    def parse_references(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    class Config:
        from_attributes = True
