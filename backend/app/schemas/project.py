import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_validator


class ProjectMemberRead(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        v = v.strip().upper()
        if not re.match(r"^[A-Z0-9]{1,20}$", v):
            raise ValueError("Project code must be 1–20 uppercase alphanumeric characters")
        return v


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectRead(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    created_by_id: int
    created_at: datetime
    members: List[ProjectMemberRead] = []

    class Config:
        from_attributes = True
