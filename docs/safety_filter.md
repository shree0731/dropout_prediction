# Safety Architecture: Rule-Based Safety Filter

## Overview
The conversational academic assistant uses an explicit, deterministic **rule-based safety filter** to triage incoming messages. It checks for critical signs of self-harm, suicidal ideation, and acute distress, while routing general academic anxiety to empathetic mentoring support.

> **CRITICAL CLINICAL & LEGAL DISCLAIMER:** This filter is a deterministic software triage rule set and does **NOT** constitute a clinical diagnostic tool, medical device, or replacement for qualified mental health professionals.

---

## How the Rules Work

The filter operates through two priority regex rule sets:

```
                      +-----------------------------+
                      |     Student Chat Message    |
                      +-----------------------------+
                                     |
                                     v
                  +-------------------------------------+
                  |   Rule Set 1: Crisis Regex Guard    |
                  +-------------------------------------+
                                 /       \
                        [Match] /         \ [No Match]
                               v           v
              +--------------------+   +-------------------------------------+
              | Outcome: CRISIS    |   | Rule Set 2: Academic-Stress Matcher |
              | - Crisis Helplines |   +-------------------------------------+
              | - Escalate to ERP  |               /              \
              +--------------------+      [Match] /                \ [No Match]
                                                 v                  v
                                   +-------------------+   +--------------------+
                                   | Outcome: STRESS   |   | Outcome: NONE      |
                                   | - Supportive text |   | - Normal academic  |
                                   | - Mentor offer    |   |   advising bot     |
                                   | - No helplines    |   +--------------------+
                                   +-------------------+
```

### 1. Priority 1: Strict Crisis Regex
- **Target**: Acute suicide ideation, self-harm, ending life, severe hopelessness, domestic abuse, and severe trauma.
- **Rule Precedence**: **Crisis always wins.** If any crisis rule matches, the message is immediately triaged as `crisis`.
- **System Action**: 
  - Injects verified national emergency mental health helplines (**Tele-MANAS `14416`**, **KIRAN `1800-599-0019`**) and campus counseling desk contacts.
  - For institutional calls with valid `X-API-Key`, initiates an asynchronous meeting request to the student's faculty mentor with zero message text transmitted.

### 2. Priority 2: Rule-Based Academic-Stress Matcher
- **Target**: Exam failure anxiety, CIA test panic, attendance condonation fear, detention worries, and academic workload overload.
- **System Action**:
  - Responds empathetically to normalize academic setbacks.
  - Offers a consultation with the student's assigned faculty mentor.
  - **Does NOT trigger suicide crisis banners or emergency hotlines**, ensuring standard academic stress is not pathologized or escalated inappropriately.

### 3. Priority 3: Normal Academic Advising
- If neither rule set triggers, the message proceeds to standard academic advising (course requirements, attendance inquiries, marks breakdown, and calendar questions).

---

## Standing Safety Disclaimer
Every chatbot response across the system carries the standing disclaimer line:
> `AI academic assistant. Not a substitute for professional counseling or official academic advice. Immediate crisis support: Tele-MANAS (14416) | KIRAN (1800-599-0019).`

---

## Known Limitations: What the Rules Miss

Because this filter relies on explicit keyword and regex pattern matching rather than deep semantic language modeling, it has several documented limitations:

1. **Indirect Phrasing & Euphemisms**:
   - The filter will miss veiled expressions of despair that do not use direct keywords (e.g., *"I don't want to wake up tomorrow"*, *"nobody cares if I die today"*, *"I have pills and I'm ready to end it"*).
2. **Sarcasm & Figurative Hyperbole**:
   - Everyday conversational hyperbole (e.g., *"this math test is going to kill me"*) may match keywords if not carefully bounded, while sarcastic cries for help will be missed.
3. **Multilingual & Code-Mixed Expressions**:
   - While primary transliterated Hindi and Tamil crisis phrases are included, unsupported regional Indian languages and dialect variations are not recognized.
4. **Context Blindness**:
   - The rules evaluate messages individually without multi-turn psychological trajectory tracking.
5. **No Clinical Validation**:
   - Evaluated on hand-written academic safety benchmark scenarios for engineering student advising; not validated in clinical settings.
