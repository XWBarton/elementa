"""Fire-and-forget helpers for notifying Tessera of Elementa events."""
import json
import os
import re
import urllib.error
import urllib.request

from sqlalchemy.orm import Session

from app.models.app_setting import AppSetting


def _get_tessera_url_and_token(db: Session) -> tuple[str, str]:
    settings = {s.key: s.value for s in db.query(AppSetting).all()}
    internal = os.environ.get("TESSERA_INTERNAL_URL", "").strip()
    url = internal.rstrip("/") if internal else re.sub(
        r"(?i)^(https?://)localhost\b", r"\1host.docker.internal",
        settings.get("tessera_url", "").strip().rstrip("/"),
    )
    token = settings.get("tessera_api_token", "").strip()
    return url, token


def notify_unlink(db: Session, specimen_code: str, elementa_ref: str) -> None:
    """Tell Tessera to clear the molecular_ref on usage log entries linked to this run.
    Silently does nothing if Tessera is not configured or unreachable."""
    try:
        url, token = _get_tessera_url_and_token(db)
        if not url or not token or not specimen_code:
            return
        data = json.dumps({"specimen_code": specimen_code, "elementa_ref": elementa_ref}).encode()
        req = urllib.request.Request(
            f"{url}/api/specimens/unlink-elementa",
            data=data,
            method="DELETE",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass  # never block the delete operation
