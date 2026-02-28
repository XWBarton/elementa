import json
from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.protocol import Protocol
from app.schemas.protocol import ProtocolCreate, ProtocolUpdate


def _query(db: Session):
    return db.query(Protocol).options(joinedload(Protocol.created_by))


def get_protocols(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[Protocol], int]:
    total = db.query(func.count(Protocol.id)).scalar()
    items = _query(db).order_by(Protocol.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_protocol(db: Session, protocol_id: int) -> Optional[Protocol]:
    return _query(db).filter(Protocol.id == protocol_id).first()


def create_protocol(db: Session, data: ProtocolCreate, user_id: Optional[int] = None) -> Protocol:
    raw = data.model_dump()
    if raw.get("steps") is not None:
        raw["steps"] = json.dumps(raw["steps"])
    if raw.get("materials") is not None:
        raw["materials"] = json.dumps(raw["materials"])
    protocol = Protocol(**raw, created_by_id=user_id)
    db.add(protocol)
    db.commit()
    db.refresh(protocol)
    return get_protocol(db, protocol.id)


def update_protocol(db: Session, obj: Protocol, data: ProtocolUpdate) -> Protocol:
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "steps" and value is not None:
            value = json.dumps(value)
        elif key == "materials" and value is not None:
            value = json.dumps(value)
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return get_protocol(db, obj.id)


def delete_protocol(db: Session, obj: Protocol) -> None:
    db.delete(obj)
    db.commit()


def list_all_protocols(db: Session) -> List[Protocol]:
    """For run form dropdowns."""
    return db.query(Protocol).order_by(Protocol.name).all()
