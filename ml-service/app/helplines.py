"""
National Crisis & Student Mental Health Helplines
Single shared helplines loader for Python ML service.

IMPORTANT STATUS NOTICE:
Status: unverified – owner to confirm
The project owner must re-verify these numbers against the official government websites before deployment.

Official sources:
- Tele-MANAS (14416): https://telemanas.mohfw.gov.in/ (National Tele Mental Health Programme)
- KIRAN (1800-599-0019): https://depwd.gov.in/ (Dept of Empowerment of Persons with Disabilities, MSJE)

Last verified date: 2026-10-11
"""

import os
import json
from pathlib import Path

# Locate shared helplines.json
_CURRENT_DIR = Path(__file__).resolve().parent
_CONFIG_CANDIDATES = [
    _CURRENT_DIR.parent.parent / "backend" / "config" / "helplines.json",
    _CURRENT_DIR.parent / "config" / "helplines.json",
    Path("config/helplines.json")
]

HELPLINES_DATA = None
for candidate in _CONFIG_CANDIDATES:
    if candidate.exists():
        with open(candidate, "r", encoding="utf-8") as f:
            HELPLINES_DATA = json.load(f)
        break

if not HELPLINES_DATA:
    HELPLINES_DATA = {
        "status": "unverified – owner to confirm",
        "last_verified": "2026-10-11",
        "helplines": [
            {
                "id": "tele_manas",
                "name": "National Student Mental Health Helpline (Tele-MANAS)",
                "number": "14416",
                "hours": "24x7",
                "cost": "Toll-Free",
                "source_url": "https://telemanas.mohfw.gov.in/",
                "status": "unverified – owner to confirm",
                "last_verified": "2026-10-11"
            },
            {
                "id": "kiran",
                "name": "KIRAN Mental Health Helpline",
                "number": "1800-599-0019",
                "hours": "24x7",
                "cost": "Toll-Free",
                "source_url": "https://depwd.gov.in/",
                "status": "unverified – owner to confirm",
                "last_verified": "2026-10-11"
            }
        ]
    }

def get_helplines_text() -> str:
    env = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
    is_dev_or_test = env in ("development", "dev", "test")
    lines = []
    for h in HELPLINES_DATA.get("helplines", []):
        is_verified = h.get("verified", False)
        unverified_tag = " [unverified – owner to confirm]" if (not is_verified and is_dev_or_test) else ""
        lines.append(f"• **{h['name']}**: Call {h['number']} ({h['cost']}, {h['hours']}){unverified_tag}")
    return "\n".join(lines)
