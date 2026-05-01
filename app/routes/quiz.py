"""
Quiz Route
-----------
POST /quiz/generate  — generate MCQ questions for a topic
POST /quiz/submit    — submit answers, get score + memory update
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.llm_service import generate_quiz, evaluate_answer
from services.memory_service import caretaker

router = APIRouter(prefix="/quiz", tags=["quiz"])


# ── Generate Quiz ─────────────────────────────────────────────────────────────

class GenerateQuizRequest(BaseModel):
    student_id: str = "default"
    topic: str
    num_questions: int = 5


@router.post("/generate")
def generate(req: GenerateQuizRequest):
    profile = caretaker.get_profile(req.student_id)
    context = profile.get_context_summary()

    questions = generate_quiz(
        topic=req.topic,
        num_questions=req.num_questions,
        context=context,
    )

    # Add topic to memory even before submission
    profile.add_topic(req.topic)
    caretaker.checkpoint(req.student_id)

    # Strip answers from what we send to the client (honesty matters!)
    client_questions = [
        {
            "id": i,
            "question": q["question"],
            "options": q["options"],
        }
        for i, q in enumerate(questions)
    ]

    # Store full questions (with answers) server-side in a temp cache
    # keyed by student_id+topic so /submit can validate
    _quiz_cache[f"{req.student_id}::{req.topic}"] = questions

    return {
        "topic": req.topic,
        "questions": client_questions,
        "total": len(client_questions),
    }


# ── Submit Answers ────────────────────────────────────────────────────────────

class AnswerItem(BaseModel):
    id: int
    selected: str   # "A" | "B" | "C" | "D"


class SubmitQuizRequest(BaseModel):
    student_id: str = "default"
    topic: str
    answers: List[AnswerItem]


_quiz_cache: dict = {}   # in-memory; keyed by "student_id::topic"


@router.post("/submit")
def submit(req: SubmitQuizRequest):
    cache_key = f"{req.student_id}::{req.topic}"
    questions = _quiz_cache.get(cache_key, [])

    # Also check PDF quiz cache if not found in regular cache
    if not questions:
        try:
            from routes.pdf import get_pdf_quiz_cache
            questions = get_pdf_quiz_cache().get(cache_key, [])
        except Exception:
            pass

    if not questions:
        return {
            "error": "No active quiz found for this topic. Please generate a quiz first.",
            "score": 0,
            "total": 0,
            "results": [],
        }

    profile = caretaker.get_profile(req.student_id)
    results = []
    score = 0

    answer_map = {a.id: a.selected for a in req.answers}

    for i, q in enumerate(questions):
        selected = answer_map.get(i, "")
        correct = q["answer"]
        explanation = q.get("explanation", "")
        evaluation = evaluate_answer(q["question"], selected, correct, explanation)

        if evaluation["is_correct"]:
            score += 1
        else:
            # Record the mistake in student memory
            wrong_option = q["options"][ord(selected.upper()) - ord("A")] if selected and selected.upper() in "ABCD" else selected
            correct_option = q["options"][ord(correct.upper()) - ord("A")] if correct.upper() in "ABCD" else correct
            profile.record_mistake(
                topic=req.topic,
                question=q["question"],
                wrong=wrong_option,
                correct=correct_option,
            )

        results.append({
            "id": i,
            "question": q["question"],
            "options": q["options"],
            "selected": selected,
            "correct_answer": correct,
            **evaluation,
        })

    # Record quiz score in memory
    profile.record_quiz_result(req.topic, score, len(questions))
    caretaker.checkpoint(req.student_id)

    # Clean up cache entry
    _quiz_cache.pop(cache_key, None)

    percentage = round((score / len(questions)) * 100, 1) if questions else 0
    return {
        "topic": req.topic,
        "score": score,
        "total": len(questions),
        "percentage": percentage,
        "results": results,
        "message": _score_message(percentage),
    }


def _score_message(pct: float) -> str:
    if pct >= 90:
        return "🏆 Excellent! You've mastered this topic!"
    elif pct >= 70:
        return "✅ Good job! Review the ones you missed."
    elif pct >= 50:
        return "📚 Keep studying — you're getting there!"
    else:
        return "💡 Don't worry, practice makes perfect!"
