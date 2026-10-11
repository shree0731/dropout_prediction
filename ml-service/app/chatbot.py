import os
import re
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Any, Tuple
from app.helplines import get_helplines_text, HELPLINES_DATA

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Standard safety disclaimer
DISCLAIMER_TEXT = "AI academic assistant. Not a substitute for professional counseling or official academic advice. Immediate crisis support: Tele-MANAS (14416) | KIRAN (1800-599-0019)."

def get_counselling_info(college_id: str = None) -> str:
    _CURRENT_DIR = Path(__file__).resolve().parent
    candidates = [
        _CURRENT_DIR.parent.parent / "backend" / "config" / "counselling.json",
        _CURRENT_DIR.parent.parent / "backend" / "config" / "counselling.example.json",
        Path("config/counselling.json")
    ]
    for config_file in candidates:
        if config_file.exists():
            try:
                with open(config_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                entry = (data.get(college_id) if college_id else None) or data.get("default")
                if entry:
                    desk = entry.get("desk_name", "Student Counselling Desk")
                    email = entry.get("email")
                    phone = entry.get("phone")
                    is_demo = entry.get("is_demo", False)
                    parts = []
                    if email:
                        parts.append(f"Email: {email} (demo contact)" if is_demo else f"Email: {email}")
                    if phone:
                        parts.append(f"Phone: {phone}")
                    if parts:
                        return f"• **{desk}**: {' | '.join(parts)}"
                    return f"• **{desk}**: Direct walk-in or consult your faculty mentor"
            except Exception as e:
                print(f"[CounsellingConfig Notice] Error loading config: {e}")
                break
    return "• **Campus Student Counselling Centre**: Direct walk-in or consult your faculty mentor"

from app.distress import classify_distress

MEETING_TRIGGERS = [
    r"\bmeet\b", r"\bmeeting\b", r"\bschedule\b", r"\btalk to (my )?mentor\b",
    r"\bcounsel(or|ing)?\b", r"\bappointment\b", r"\bbook a session\b",
    r"\bhelp me talk\b", r"\bspeak with (a|my) (mentor|teacher|professor|counselor)\b"
]

def is_meeting_request(message: str) -> bool:
    msg_lower = message.lower()
    return any(re.search(pattern, msg_lower) for pattern in MEETING_TRIGGERS)

def build_system_instruction(student: dict) -> str:
    name = student.get("student_name", "Student")
    dept = student.get("department", "Engineering")
    year = student.get("year_of_study", 2)
    attendance = student.get("attendance_pct", 75.0)
    gpa = student.get("overall_gpa", 6.8)
    backlogs = student.get("backlogs_count", 0)
    risk = student.get("prediction", "Low")
    mentor_name = student.get("mentor_name", "Dr. Kavitha Swaminathan")

    instruction = f"""You are 'Astra', an empathetic, proactive, and knowledgeable Academic Advisor & Retention Bot for engineering undergraduates.
You are assisting {name}, a Year {year} student in the Department of {dept}.
Verified student records:
- Overall Attendance: {attendance}% (Anna University / Institution cutoff is 75%)
- Current Backlogs: {backlogs}
- Cumulative GPA: {gpa}/10.0
- Dropout Risk Assessment: {risk} Risk
- Assigned Faculty Mentor: {mentor_name}

Your Responsibilities:
1. Proactive & Empathetic Tone: If attendance is <75% or backlogs > 0, speak gently and warmly.
2. Factual Grounding: Answer mark breakdowns, exam eligibility, and attendance inquiries ONLY using the verified records above. NEVER hallucinate grades or attendance figures.
3. Meeting Scheduling: If the student asks to speak with their mentor or counselor, acknowledge that a meeting can be requested.
4. Boundaries: Never pretend to be a licensed therapist. For severe distress, point to professional helplines.
Keep responses concise, conversational, and solution-oriented."""
    return instruction

def call_gemini_api(prompt: str, system_instruction: str) -> str:
    if not GEMINI_API_KEY:
        return ""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 600
        }
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            candidates = res_json.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
    except Exception as e:
        print(f"[Gemini API Notice] {e}. Falling back to rule-based response engine.")
    return ""

def rule_based_fallback_advisor(message: str, student: dict) -> str:
    msg_lower = message.lower()
    name = student.get("student_name", "there")
    att = student.get("attendance_pct", 75.0)
    backlogs = student.get("backlogs_count", 0)
    gpa = student.get("overall_gpa", 6.8)
    mentor = student.get("mentor_name", "your faculty mentor")

    if any(k in msg_lower for k in ["attendance", "present", "absent", "cutoff"]):
        if att < 75.0:
            return (
                f"Hi {name}, your current attendance is recorded at **{att}%**, which is currently below the mandatory 75% requirement. "
                f"To avoid semester condonation or exam detention, you will need consistent attendance over the coming weeks. "
                f"Would you like me to schedule a brief check-in with {mentor} to discuss attendance recovery?"
            )
        else:
            return f"Hi {name}, your attendance is in good standing at **{att}%** (comfortably above the 75% institutional threshold). Keep up the regular attendance!"

    if any(k in msg_lower for k in ["backlog", "arrear", "exam", "gpa", "marks"]):
        if backlogs > 0:
            return (
                f"According to your records, you currently have **{backlogs} active backlog(s)** and an overall GPA of **{gpa}**. "
                f"The department offers remedial tutorial sessions and peer study groups for core subjects. "
                f"Let's get this sorted early so it doesn't affect your placement eligibility."
            )
        else:
            return f"You currently have **0 backlogs** and an overall GPA of **{gpa}/10.0**. You are in good academic standing!"

    if any(k in msg_lower for k in ["hi", "hello", "hey"]):
        if att < 75.0 or backlogs > 1:
            return (
                f"Hey {name}! I was just checking through your semester profile. Noticed you've had a busy term — "
                f"how are classes going? Let me know if you need help with attendance rules, course tutoring, or booking time with {mentor}."
            )
        return f"Hey {name}! How are your classes going this week? Feel free to ask about your attendance, marks, or academic scheduling."

    return (
        f"I'm here to support your academic progress, {name}. Your current records show {att}% attendance and {backlogs} backlogs. "
        f"You can ask me about your exam eligibility, revision schedules, or request an in-person meeting with {mentor}."
    )

def get_chatbot_response(message: str, student_context: dict) -> dict:
    """
    Core intervention chatbot logic.
    Returns:
    {
      "reply": str,
      "meeting_requested": bool,
      "is_distress": bool,
      "distress_category": str,
      "disclaimer": str,
      "meeting_details": {
         "requested_with": "mentor" | "counselor",
         "reason": str
      } | None
    }
    """
    # 1. Two-Layer Safety Distress Evaluation
    distress_outcome, distress_score = classify_distress(message)

    if distress_outcome == "crisis":
        college_id = student_context.get("college_id") if student_context else None
        counselling_info = get_counselling_info(college_id)
        crisis_reply = (
            "I hear how overwhelmed you are feeling right now, and I want you to know you don't have to carry this alone. "
            "Please reach out to someone who can support you immediately:\n\n"
            f"{get_helplines_text()}\n"
            f"{counselling_info}\n\n"
        )
        return {
            "reply": crisis_reply,
            "meeting_requested": True,
            "is_distress": True,
            "distress_category": "crisis",
            "disclaimer": DISCLAIMER_TEXT,
            "meeting_details": {
                "requested_with": "counselor",
                "reason": "Immediate emotional distress / crisis detection"
            }
        }

    if distress_outcome == "stress":
        mentor_name = student_context.get("mentor_name", "your faculty mentor") if student_context else "your faculty mentor"
        name = student_context.get("student_name", "there") if student_context else "there"
        stress_reply = (
            f"I hear how much stress and anxiety you're carrying right now, {name}. "
            "Academic pressure and difficult exams can feel overwhelming, but please remember that setbacks are manageable and you don't have to handle them all on your own. "
            f"Would you like me to connect you with {mentor_name} to review your situation and work out a recovery plan together?"
        )
        return {
            "reply": stress_reply,
            "meeting_requested": False,
            "is_distress": False,
            "distress_category": "stress",
            "disclaimer": DISCLAIMER_TEXT,
            "meeting_details": None
        }

    # 2. Meeting / Escalation Trigger Check
    meeting_intent = is_meeting_request(message)
    requested_with = "counselor" if "counsel" in message.lower() else "mentor"
    reason = "Student requested 1-on-1 faculty mentor consultation"

    # 3. Formulate Prompt & LLM Call
    system_instruction = build_system_instruction(student_context)
    gemini_reply = call_gemini_api(message, system_instruction)

    if gemini_reply:
        reply = gemini_reply
    else:
        reply = rule_based_fallback_advisor(message, student_context)

    return {
        "reply": reply,
        "meeting_requested": meeting_intent,
        "is_distress": False,
        "distress_category": "none",
        "disclaimer": DISCLAIMER_TEXT,
        "meeting_details": {
            "requested_with": requested_with,
            "reason": reason
        } if meeting_intent else None
    }
