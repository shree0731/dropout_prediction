"""
Rule-Based Safety Filter

Architecture:
- Strict Crisis Regex Matcher: Acute crisis, self-harm, ending life, severe trauma.
- Rule-Based Academic-Stress Matcher: Exam anxiety, detention fear, academic overload.

Rules:
1. Crisis always wins: If any crisis pattern matches, outcome is 'crisis'.
2. If no crisis matches, but academic-stress pattern matches, outcome is 'stress'.
3. Otherwise, outcome is 'none' (normal chat).

Privacy Guarantee: Never logs student message text; logs only outcome label.
Limitations: Not clinically validated; cannot detect indirect phrasing, sarcasm, or unsupported languages.
"""

import re
import logging
from typing import Tuple

logger = logging.getLogger("safety_filter")
logger.setLevel(logging.INFO)

# --- Strict Crisis Regex Patterns ---
CRISIS_REGEX_PATTERNS = [
    # Suicide & Self-Harm
    r"\bsuicid",
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\bend it all\b",
    r"\bhurt myself\b",
    r"\bcutting myself\b",
    r"\bself[- ]harm\b",
    r"\boverdose\b",
    r"\bwant to die\b",
    r"\bdon't want to live\b",
    r"\bwish i (were|was) dead\b",
    r"\bdone with life\b",
    r"\btired of existing\b",
    r"\bhanging rope\b",
    r"\bjump off\b",
    # Hopelessness & Severe Despair
    r"\bhopeless\b",
    r"\bcan't go on\b",
    r"\bno reason to live\b",
    r"\bno point in living\b",
    r"\bno point in continuing\b",
    r"\bgive up on life\b",
    r"\bnothing matters anymore\b",
    r"\beveryone would be better off without me\b",
    r"\bcan't take it anymore\b",
    r"\bcan't take this pain\b",
    r"\bunbearable\b",
    # Abuse & Severe Trauma
    r"\bdomestic violence\b",
    r"\bseverely (harassed|assaulted)\b",
    r"\bragging is unbearable\b",
    r"\bmy final goodbye\b",
    r"\bgoodbye everyone\b",
    r"\bthis is goodbye\b",
    # Transliterated Hindi / Tamil
    r"\bsab khatam ho gaya\b",
    r"\bjeene ki koi wajah nahi\b",
    r"\bmar jana chahta\b",
    r"\benakku vaazha pidikkala\b",
    r"\benakku vaazha vendam\b",
    r"\buyirai\s+maayi",
    r"\buyira\s+vidan"
]

# --- Rule-Based Academic-Stress Matcher Patterns ---
STRESS_REGEX_PATTERNS = [
    r"\b(failed|fail) (the )?(exam|cia|internal|test|arrear|mathematics)\b",
    r"\bscared to tell (my )?parents\b",
    r"\b(worried|terrified|anxious|panicking) about (detention|condonation|arrear|exam|marks|placements)\b",
    r"\battendance (dropped|is strictly checked|<75%|deficit)\b",
    r"\b(extreme|so much) (stress|tension|pressure|anxiety)\b",
    r"\b(overwhelmed|exhausted|burned out) with (workload|assignments|projects|classes)\b",
    r"\b(homesick|lonely) in (the )?(hostel|college)\b",
    r"\b(bohot|bahut) (tension|stress|darr)\b",
    r"\b(romba|periya) (bayama|stress|kashtama)\b"
]

def classify_distress(message: str) -> Tuple[str, float]:
    """
    Evaluates message using the rule-based safety filter.
    Returns: Tuple[outcome, confidence_score]
    where outcome is 'crisis' | 'stress' | 'none'.

    Precedence:
    1. Crisis always wins.
    2. Stress gets supportive mentor guidance (no crisis helplines).
    3. None proceeds to standard chat.
    """
    msg_lower = (message or "").lower().strip()

    # Rule 1: Crisis always wins
    for pat in CRISIS_REGEX_PATTERNS:
        if re.search(pat, msg_lower):
            logger.info("Safety filter outcome: crisis (rule: crisis_regex)")
            return "crisis", 1.0

    # Rule 2: Academic-stress matcher
    for pat in STRESS_REGEX_PATTERNS:
        if re.search(pat, msg_lower):
            logger.info("Safety filter outcome: stress (rule: stress_regex)")
            return "stress", 1.0

    # Rule 3: Normal chat
    return "none", 0.0
