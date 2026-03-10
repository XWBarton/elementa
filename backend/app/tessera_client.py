"""Fire-and-forget helpers for notifying Tessera of Elementa events."""
import json
import logging
import os
import re
import urllib.error
import urllib.request

from sqlalchemy.orm import Session

from app.models.app_setting import AppSetting

log = logging.getLogger(__name__)


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
        if not url:
            log.warning("notify_unlink: Tessera URL not configured — skipping unlink for %s / %s", specimen_code, elementa_ref)
            return
        if not token:
            log.warning("notify_unlink: Tessera API token not configured — skipping unlink for %s / %s", specimen_code, elementa_ref)
            return
        if not specimen_code:
            return
        data = json.dumps({"specimen_code": specimen_code, "elementa_ref": elementa_ref}).encode()
        req = urllib.request.Request(
            f"{url}/api/specimens/unlink-elementa",
            data=data,
            method="DELETE",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        resp = urllib.request.urlopen(req, timeout=5)
        result = json.loads(resp.read())
        log.info("notify_unlink: %s / %s → %s", specimen_code, elementa_ref, result)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        log.error("notify_unlink: HTTP %s from Tessera for %s / %s — %s", e.code, specimen_code, elementa_ref, body)
    except Exception as e:
        log.error("notify_unlink: unexpected error for %s / %s — %s", specimen_code, elementa_ref, e)
