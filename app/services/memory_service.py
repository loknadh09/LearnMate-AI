"""
Memory Service — Memento Pattern
---------------------------------
Originator  : StudentProfile   (holds current student state)
Memento     : StudentMemento   (immutable snapshot)
Caretaker   : MemoryCaretaker  (stores & retrieves snapshots per student_id)
"""

import json
import os
from datetime import datetime
from typing import Optional

# ─────────────────────────────────────────────
# Memento  (immutable snapshot)
# ─────────────────────────────────────────────
class StudentMemento:
    def __init__(self, state: dict):
        self._state = json.loads(json.dumps(state))  # deep copy

    def get_state(self) -> dict:
        return json.loads(json.dumps(self._state))


# ─────────────────────────────────────────────
# Originator  (student profile)
# ─────────────────────────────────────────────
class StudentProfile:
    def __init__(self, student_id: str):
        self.student_id = student_id
        self._state = {
            "student_id": student_id,
            "topics_covered": [],        # list of topic strings
            "mistakes": [],              # list of {"topic", "question", "wrong_answer", "correct_answer"}
            "quiz_scores": [],           # list of {"topic", "score", "total", "timestamp"}
            "learning_style": "balanced",# "visual" | "detailed" | "simple" | "balanced"
            "total_questions_asked": 0,
            "sessions": [],              # list of session timestamps
            "last_active": None,
        }

    # ── state helpers ──────────────────────────
    def add_topic(self, topic: str):
        if topic not in self._state["topics_covered"]:
            self._state["topics_covered"].append(topic)

    def record_mistake(self, topic: str, question: str, wrong: str, correct: str):
        self._state["mistakes"].append({
            "topic": topic,
            "question": question,
            "wrong_answer": wrong,
            "correct_answer": correct,
            "timestamp": datetime.utcnow().isoformat()
        })

    def record_quiz_result(self, topic: str, score: int, total: int):
        self._state["quiz_scores"].append({
            "topic": topic,
            "score": score,
            "total": total,
            "percentage": round((score / total) * 100, 1) if total else 0,
            "timestamp": datetime.utcnow().isoformat()
        })

    def increment_questions(self):
        self._state["total_questions_asked"] += 1
        self._state["last_active"] = datetime.utcnow().isoformat()

    def set_learning_style(self, style: str):
        allowed = {"visual", "detailed", "simple", "balanced"}
        if style in allowed:
            self._state["learning_style"] = style

    def get_state(self) -> dict:
        return json.loads(json.dumps(self._state))

    def get_context_summary(self) -> str:
        """Returns a compact text summary for the LLM prompt."""
        s = self._state
        topics = ", ".join(s["topics_covered"][-5:]) if s["topics_covered"] else "none yet"
        recent_mistakes = s["mistakes"][-3:] if s["mistakes"] else []
        mistake_txt = "; ".join(
            f"confused '{m['wrong_answer']}' for '{m['correct_answer']}' on '{m['topic']}'"
            for m in recent_mistakes
        ) or "no recent mistakes"
        scores = s["quiz_scores"][-3:] if s["quiz_scores"] else []
        score_txt = ", ".join(
            f"{sc['topic']}:{sc['percentage']}%" for sc in scores
        ) or "no quiz history"
        style = s["learning_style"]
        return (
            f"Student profile: learning_style={style}. "
            f"Recent topics: {topics}. "
            f"Recent mistakes: {mistake_txt}. "
            f"Quiz performance: {score_txt}."
        )

    # ── Memento interface ──────────────────────
    def save(self) -> StudentMemento:
        return StudentMemento(self._state)

    def restore(self, memento: StudentMemento):
        self._state = memento.get_state()


# ─────────────────────────────────────────────
# Caretaker  (manages mementos per student)
# ─────────────────────────────────────────────
MEMORY_FILE = os.path.join(os.path.dirname(__file__), "..", "database", "student_memory.json")

class MemoryCaretaker:
    def __init__(self):
        self._profiles: dict[str, StudentProfile] = {}
        self._history: dict[str, list[StudentMemento]] = {}
        self._load_from_disk()

    # ── persistence ───────────────────────────
    def _load_from_disk(self):
        os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
        if os.path.exists(MEMORY_FILE):
            try:
                with open(MEMORY_FILE, "r") as f:
                    data: dict = json.load(f)
                for sid, state in data.items():
                    p = StudentProfile(sid)
                    p._state = state
                    self._profiles[sid] = p
                    self._history[sid] = [p.save()]
            except Exception:
                pass  # start fresh on corrupt data

    def _save_to_disk(self):
        os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
        data = {sid: p.get_state() for sid, p in self._profiles.items()}
        with open(MEMORY_FILE, "w") as f:
            json.dump(data, f, indent=2)

    # ── public API ────────────────────────────
    def get_profile(self, student_id: str) -> StudentProfile:
        if student_id not in self._profiles:
            self._profiles[student_id] = StudentProfile(student_id)
            self._history[student_id] = []
        return self._profiles[student_id]

    def checkpoint(self, student_id: str):
        """Save a memento snapshot and persist to disk."""
        profile = self.get_profile(student_id)
        memento = profile.save()
        self._history.setdefault(student_id, []).append(memento)
        # keep at most 20 snapshots
        if len(self._history[student_id]) > 20:
            self._history[student_id] = self._history[student_id][-20:]
        self._save_to_disk()

    def undo(self, student_id: str) -> Optional[StudentMemento]:
        """Restore the previous state (undo last action)."""
        history = self._history.get(student_id, [])
        if len(history) > 1:
            history.pop()   # discard current
            prev = history[-1]
            self.get_profile(student_id).restore(prev)
            self._save_to_disk()
            return prev
        return None

    def get_all_progress(self) -> list[dict]:
        return [p.get_state() for p in self._profiles.values()]


# ── Singleton ─────────────────────────────────
caretaker = MemoryCaretaker()
