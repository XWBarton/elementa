import re
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.crud import protocols as crud
from app.dependencies import get_current_user, get_db, require_admin
from app.schemas.protocol import ProtocolCreate, ProtocolRead, ProtocolUpdate

router = APIRouter(prefix="/protocols", tags=["protocols"])


# ── Typst PDF generation ───────────────────────────────────────────────────────

CATEGORY_LABELS = {
    "extraction": "Extraction",
    "pcr": "PCR",
    "sanger": "Sanger",
    "library_prep": "Library Prep",
    "ngs": "NGS",
    "general": "General",
}

CATEGORY_COLORS = {
    "extraction": ("5b8c00", "d9f7be"),
    "pcr": ("1677ff", "e6f4ff"),
    "sanger": ("722ed1", "f9f0ff"),
    "library_prep": ("d46b08", "fff7e6"),
    "ngs": ("08979c", "e6fffb"),
    "general": ("595959", "f5f5f5"),
}


def _esc(s: Optional[str]) -> str:
    """Escape user text for Typst content mode."""
    if not s:
        return ""
    s = s.replace("\\", "\\u{005C}")
    for ch in ["#", "*", "_", "$", "`", "@", "<", ">"]:
        s = s.replace(ch, "\\" + ch)
    # single newline → Typst forced line break; double newline stays as paragraph break
    s = s.replace("\n\n", "\x00PARA\x00")
    s = s.replace("\n", "\\\n")
    s = s.replace("\x00PARA\x00", "\n\n")
    return s


def _badge(text: str, bg: str, fg: str) -> str:
    return f'#box(fill: rgb("{bg}"), inset: (x: 6pt, y: 3pt), radius: 3pt)[#text(size: 9pt, fill: rgb("{fg}"))[{text}]]'


def _build_typst(protocol: ProtocolRead) -> str:
    cat = protocol.category or "general"
    cat_label = CATEGORY_LABELS.get(cat, cat.replace("_", " ").title())
    cat_fg, cat_bg = CATEGORY_COLORS.get(cat, ("595959", "f5f5f5"))

    author = ""
    if protocol.created_by:
        author = _esc(protocol.created_by.full_name or protocol.created_by.username or "")

    date_str = protocol.created_at.strftime("%d %B %Y")
    version_str = _esc(protocol.version or "")
    name_esc = _esc(protocol.name)

    # Version pill in header — no leading # (used as code-mode arg inside #grid)
    version_badge = (
        f'box(fill: white.transparentize(55%), inset: (x: 9pt, y: 5pt), radius: 4pt)'
        f'[#text(size: 10pt, fill: white)[v{version_str}]]'
        if protocol.version else "[]"
    )

    # Category tag — no leading # (used as code-mode arg inside #grid)
    cat_tag = (
        f'box(fill: rgb("{cat_bg}"), inset: (x: 7pt, y: 3pt), radius: 3pt)'
        f'[#text(fill: rgb("{cat_fg}"), weight: "semibold", size: 10pt)[{_esc(cat_label)}]]'
    )

    # Description block
    desc_block = (
        f'\n#v(10pt)\n'
        f'#block(fill: luma(248), inset: (x: 12pt, y: 10pt), radius: 4pt, width: 100%)'
        f'[#text(style: "italic")[{_esc(protocol.description)}]]\n'
        if protocol.description else ""
    )

    # Materials section
    materials_section = ""
    if protocol.materials:
        items = "\n".join(f"  - {_esc(m)}" for m in protocol.materials if m)
        materials_section = (
            f'#text(size: 13pt, weight: "bold")[Materials]\n'
            f'#v(6pt)\n{items}\n'
            f'#v(16pt)\n#line(length: 100%, stroke: 0.5pt + luma(200))\n#v(14pt)\n'
        )

    # Steps section
    steps_lines = []
    steps: list[Dict[str, Any]] = protocol.steps or []
    for i, step in enumerate(steps):
        title = _esc(str(step.get("title", "")))
        description = _esc(str(step.get("description", ""))) if step.get("description") else ""
        step_type = step.get("step_type", "standard")

        if step_type == "thermocycling":
            cycles = step.get("cycles")
            thermo_badge = _badge(f"Thermocycling{f' · {cycles}×' if cycles else ''}", "fff7e6", "d46b08")
            badges = f"[{thermo_badge}]"

            def _tc_row(label: str, temp: Any, time: Any) -> str:
                parts = []
                if temp is not None:
                    parts.append(f"{temp}\u00b0C")
                if time is not None:
                    parts.append(f"{time} s")
                return f"  [#text(fill: luma(100), size: 9pt)[{label}]], [{', '.join(parts) or '\u2014'}]," if parts else ""

            tc_rows = []
            for label, tk, tv in [
                ("Initial denat.", "initial_denat_temp_c", "initial_denat_time_s"),
                ("Denaturation", "denat_temp_c", "denat_time_s"),
                ("Annealing", "anneal_temp_c", "anneal_time_s"),
                ("Extension", "extend_temp_c", "extend_time_s"),
                ("Final extension", "final_extend_temp_c", "final_extend_time_s"),
            ]:
                row = _tc_row(label, step.get(tk), step.get(tv))
                if row:
                    tc_rows.append(row)

            tc_table = ""
            if tc_rows:
                tc_table = (
                    f"\n  #v(7pt)\n"
                    f"  #grid(columns: (auto, 1fr), column-gutter: 12pt, row-gutter: 5pt,\n"
                    + "\n".join(tc_rows) + "\n  )\n"
                )

            desc_part = (
                f"\n  #v(7pt)\n  #line(length: 100%, stroke: 0.5pt + luma(220))\n  #v(5pt)\n  {description}"
                if description else ""
            )
        else:
            duration = step.get("duration_min")
            temp = step.get("temp_c")
            rpm = step.get("rpm")

            badge_parts = []
            if duration is not None:
                badge_parts.append(_badge(f"{duration} min", "e8f4f8", "0050b3"))
            if temp is not None:
                badge_parts.append(_badge(f"{temp}\u00b0C", "fff2e8", "ad2102"))
            if rpm is not None:
                badge_parts.append(_badge(f"{rpm} RPM", "f9f0ff", "531dab"))

            badges = "[" + " #h(5pt) ".join(badge_parts) + "]" if badge_parts else "[]"
            tc_table = ""

            desc_part = (
                f"\n  #v(7pt)\n  #line(length: 100%, stroke: 0.5pt + luma(220))\n  #v(5pt)\n  {description}"
                if description else ""
            )

        steps_lines.append(
            f'#block(\n'
            f'  stroke: 0.5pt + luma(210),\n'
            f'  inset: (x: 13pt, y: 11pt),\n'
            f'  radius: 4pt,\n'
            f'  width: 100%,\n'
            f'  breakable: false,\n'
            f')[\n'
            f'  #grid(\n'
            f'    columns: (1fr, auto),\n'
            f'    column-gutter: 8pt,\n'
            f'    align: horizon,\n'
            f'    text(weight: "bold")[{i + 1}. {title}],\n'
            f'    {badges},\n'
            f'  ){tc_table}{desc_part}\n'
            f']\n'
            f'#v(8pt)'
        )

    steps_content = (
        "\n".join(steps_lines) if steps_lines
        else '#text(fill: luma(150), style: "italic")[No steps defined.]'
    )

    # Notes section
    notes_section = (
        f'\n#v(8pt)\n#line(length: 100%, stroke: 0.5pt + luma(200))\n'
        f'#v(12pt)\n#text(size: 13pt, weight: "bold")[Notes]\n'
        f'#v(6pt)\n{_esc(protocol.notes)}\n'
        if protocol.notes else ""
    )

    # References section
    references_section = ""
    if protocol.references:
        ref_lines = []
        for ref in protocol.references:
            title = _esc(ref.get("title", ""))
            url = _esc(ref.get("url", ""))
            if title and url:
                ref_lines.append(f'  - #link("{url}")[{title}] #text(fill: luma(150), size: 9pt)[({url})]')
            elif title:
                ref_lines.append(f'  - {title}')
            elif url:
                ref_lines.append(f'  - #link("{url}")[{url}]')
        if ref_lines:
            references_section = (
                f'\n#v(8pt)\n#line(length: 100%, stroke: 0.5pt + luma(200))\n'
                f'#v(12pt)\n#text(size: 13pt, weight: "bold")[References]\n'
                f'#v(6pt)\n' + "\n".join(ref_lines) + "\n"
            )

    return f"""#set document(title: "{name_esc}", author: "{author}")
#set page(
  paper: "a4",
  margin: (x: 2cm, top: 2cm, bottom: 2.8cm),
  footer: context [
    #line(length: 100%, stroke: 0.5pt + luma(200))
    #v(4pt)
    #grid(
      columns: (1fr, 1fr, 1fr),
      text(size: 8pt, fill: luma(140))[Elementa],
      align(center, text(size: 8pt, fill: luma(140))[{name_esc}]),
      align(right, text(size: 8pt, fill: luma(140))[Page #counter(page).display()])
    )
  ],
)
#set text(size: 11pt)
#set par(justify: true, leading: 0.7em)

// ── Title bar ──────────────────────────────────────────────────────────────────
#block(
  fill: rgb("1677ff"),
  inset: (x: 18pt, y: 16pt),
  radius: 6pt,
  width: 100%,
)[
  #grid(
    columns: (1fr, auto),
    column-gutter: 12pt,
    align: horizon,
    text(size: 21pt, weight: "bold", fill: white)[{name_esc}],
    {version_badge},
  )
]

#v(14pt)

// ── Metadata grid ──────────────────────────────────────────────────────────────
#grid(
  columns: (auto, 1fr, auto, 1fr),
  column-gutter: 10pt,
  row-gutter: 9pt,
  text(weight: "semibold")[Category:], {cat_tag},
  text(weight: "semibold")[Author:], [{author or "\u2014"}],
  text(weight: "semibold")[Version:], [{version_str or "\u2014"}],
  text(weight: "semibold")[Date:], [{date_str}],
)
{desc_block}
#v(14pt)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(16pt)

// ── Materials ──────────────────────────────────────────────────────────────────
{materials_section}
// ── Procedure ──────────────────────────────────────────────────────────────────
#text(size: 13pt, weight: "bold")[Procedure]
#v(10pt)
{steps_content}
{notes_section}
{references_section}
"""


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/", response_model=dict)
def list_protocols(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    items, total = crud.get_protocols(db, skip=skip, limit=limit)
    return {
        "items": [ProtocolRead.model_validate(p) for p in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/all", response_model=list[ProtocolRead])
def all_protocols(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """For run form dropdowns – returns all protocols unfiltered."""
    return [ProtocolRead.model_validate(p) for p in crud.list_all_protocols(db)]


@router.post("/", response_model=ProtocolRead)
def create_protocol(
    data: ProtocolCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    obj = crud.create_protocol(db, data, user_id=current_user.id)
    return ProtocolRead.model_validate(obj)


@router.get("/{protocol_id}/pdf")
def download_pdf(
    protocol_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = crud.get_protocol(db, protocol_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Protocol not found")

    protocol = ProtocolRead.model_validate(obj)
    typ_source = _build_typst(protocol)

    with tempfile.TemporaryDirectory() as tmpdir:
        typ_path = Path(tmpdir) / "protocol.typ"
        pdf_path = Path(tmpdir) / "protocol.pdf"
        typ_path.write_text(typ_source, encoding="utf-8")

        try:
            result = subprocess.run(
                ["typst", "compile", str(typ_path), str(pdf_path)],
                capture_output=True,
                text=True,
                timeout=30,
            )
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail="Typst is not installed on the server")

        if result.returncode != 0:
            import logging
            logging.getLogger(__name__).error("Typst PDF generation failed: %s", result.stderr)
            raise HTTPException(status_code=500, detail="PDF generation failed")

        pdf_bytes = pdf_path.read_bytes()

    safe_name = re.sub(r"[^\w\-]", "-", protocol.name.lower()).strip("-")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="protocol-{safe_name}.pdf"'},
    )


@router.get("/{protocol_id}", response_model=ProtocolRead)
def read_protocol(
    protocol_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = crud.get_protocol(db, protocol_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Protocol not found")
    return ProtocolRead.model_validate(obj)


@router.put("/{protocol_id}", response_model=ProtocolRead)
def update_protocol(
    protocol_id: int,
    data: ProtocolUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = crud.get_protocol(db, protocol_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Protocol not found")
    obj = crud.update_protocol(db, obj, data)
    return ProtocolRead.model_validate(obj)


@router.delete("/{protocol_id}")
def delete_protocol(
    protocol_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    obj = crud.get_protocol(db, protocol_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Protocol not found")
    crud.delete_protocol(db, obj)
    return {"detail": "Deleted"}
