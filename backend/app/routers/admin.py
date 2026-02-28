import json
import urllib.error
import urllib.parse
import urllib.request

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_admin
from app.models.app_setting import AppSetting

router = APIRouter(prefix="/admin", tags=["admin"])

ALLOWED_KEYS = {"tessera_url", "tessera_api_token"}


class SettingValue(BaseModel):
    value: str


def _get_settings_map(db: Session) -> dict[str, str]:
    return {s.key: s.value for s in db.query(AppSetting).all()}


def _server_url(url: str) -> str:
    """Rewrite localhost → host.docker.internal so requests escape the container."""
    import re
    return re.sub(r"(?i)^(https?://)localhost\b", r"\1host.docker.internal", url.rstrip("/"))


@router.get("/settings/")
def get_settings(db: Session = Depends(get_db), _=Depends(require_admin)):
    m = _get_settings_map(db)
    return {
        "tessera_url": m.get("tessera_url", ""),
        "tessera_token_set": bool(m.get("tessera_api_token")),
    }


@router.put("/settings/{key}")
def set_setting(
    key: str,
    payload: SettingValue,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail="Unknown setting key")
    existing = db.query(AppSetting).filter(AppSetting.key == key).first()
    if existing:
        existing.value = payload.value
    else:
        db.add(AppSetting(key=key, value=payload.value))
    db.commit()
    return {"ok": True}


@router.get("/tessera/test")
def test_tessera(url: str = "", token: str = "", db: Session = Depends(get_db), _=Depends(require_admin)):
    if not url or not token:
        m = _get_settings_map(db)
        url = url or m.get("tessera_url", "").strip()
        token = token or m.get("tessera_api_token", "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="Tessera URL not configured")
    if not token:
        raise HTTPException(status_code=400, detail="Tessera API token not configured")
    req = urllib.request.Request(
        f"{_server_url(url)}/specimens/?limit=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        urllib.request.urlopen(req, timeout=8)
        return {"ok": True}
    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Tessera responded with {e.code}: wrong token?")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not reach Tessera: {e}")


@router.get("/tessera/search")
def search_tessera(q: str = "", db: Session = Depends(get_db), _=Depends(get_current_user)):
    if not q or len(q) < 2:
        return []

    m = _get_settings_map(db)
    url = m.get("tessera_url", "").strip()
    token = m.get("tessera_api_token", "").strip()
    if not url or not token:
        return []

    params = urllib.parse.urlencode({"search": q, "limit": 10})
    req = urllib.request.Request(
        f"{_server_url(url)}/specimens/?{params}",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=8)
        data = json.loads(resp.read())
        items = data.get("items", []) if isinstance(data, dict) else data
        return [_format(s) for s in items]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Tessera search failed: {e}")


def _format(s: dict) -> dict:
    assocs = s.get("species_associations") or []
    primary = next(
        (a for a in assocs if a.get("is_primary")),
        assocs[0] if assocs else None,
    )
    species = ""
    if primary:
        species = (
            primary.get("free_text_species")
            or (primary.get("species") or {}).get("common_name")
            or (primary.get("species") or {}).get("scientific_name")
            or ""
        )
    project = s.get("project") or {}
    return {
        "specimen_code": s["specimen_code"],
        "primary_species": species,
        "project_code": project.get("code", ""),
        "collection_date": s.get("collection_date"),
    }
