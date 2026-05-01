from fastapi import APIRouter
from pydantic import BaseModel
from services.rag_service import ask_with_rag
from services.memory_service import caretaker

router = APIRouter()


class QuestionRequest(BaseModel):
    student_id: str = "default"
    question: str
    topic: str = ""
    use_web: bool = True


@router.post("/ask")
def ask_question(req: QuestionRequest):
    result = ask_with_rag(
        student_id=req.student_id,
        question=req.question,
        topic=req.topic,
        use_web=req.use_web,
    )
    return result


class SummaryRequest(BaseModel):
    student_id: str = "default"


@router.post("/summarize")
def summarize(req: SummaryRequest):
    from services.rag_service import summarize_with_rag
    summary = summarize_with_rag(req.student_id)
    return {"summary": summary}