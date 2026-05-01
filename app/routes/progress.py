"""
Progress Route
---------------
GET  /progress/{student_id}  — full student stats
GET  /progress/all           — all students (admin view)
POST /progress/style         — update preferred learning style
DELETE /progress/{student_id}/undo — undo last action (Memento rollback)
"""

from fastapi import APIRouter
from pydantic import BaseModel
from services.memory_service import caretaker

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/{student_id}")
def get_progress(student_id: str):
    profile = caretaker.get_profile(student_id)
    state = profile.get_state()

    # Compute derived stats
    scores = state.get("quiz_scores", [])
    avg_score = (
        round(sum(s["percentage"] for s in scores) / len(scores), 1)
        if scores else 0
    )
    total_mistakes = len(state.get("mistakes", []))
    weak_topics = _compute_weak_topics(scores)

    return {
        **state,
        "avg_quiz_score": avg_score,
        "total_mistakes": total_mistakes,
        "weak_topics": weak_topics,
    }


@router.get("/")
def get_all_progress():
    return caretaker.get_all_progress()


class StyleRequest(BaseModel):
    student_id: str = "default"
    style: str   # "visual" | "detailed" | "simple" | "balanced"


@router.post("/style")
def set_style(req: StyleRequest):
    profile = caretaker.get_profile(req.student_id)
    profile.set_learning_style(req.style)
    caretaker.checkpoint(req.student_id)
    return {"message": f"Learning style updated to '{req.style}'", "style": req.style}


@router.delete("/{student_id}/undo")
def undo_last_action(student_id: str):
    memento = caretaker.undo(student_id)
    if memento:
        return {"message": "Last action undone successfully.", "state": memento.get_state()}
    return {"message": "Nothing to undo."}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _compute_weak_topics(scores: list) -> list[str]:
    """Topics where average score < 60%."""
    topic_scores: dict[str, list] = {}
    for s in scores:
        topic_scores.setdefault(s["topic"], []).append(s["percentage"])
    weak = [
        t for t, pcts in topic_scores.items()
        if (sum(pcts) / len(pcts)) < 60
    ]
    return weak
