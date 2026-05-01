"""
PDF Route
----------
POST /pdf/upload   — Upload a PDF, extract text, store in session cache
POST /pdf/quiz     — Generate quiz from uploaded PDF content
POST /pdf/summary  — Summarize uploaded PDF content
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import fitz  # PyMuPDF
from services.llm_service import generate_quiz, generate_summary
from services.memory_service import caretaker

router = APIRouter(prefix="/pdf", tags=["pdf"])

# In-memory store: student_id -> {filename, text, pages}
_pdf_cache: dict = {}
# Shared quiz answer cache (same as quiz.py) — use a module-level dict here
_quiz_answer_cache: dict = {}


def _extract_text(file_bytes: bytes) -> tuple[str, int]:
    """Extract text from PDF bytes. Returns (text, page_count)."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        texts = []
        for page in doc:
            texts.append(page.get_text())
        doc.close()
        full_text = "\n\n".join(texts).strip()
        return full_text, len(texts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")


@router.post("/upload")
async def upload_pdf(
    student_id: str = Form("default"),
    file: UploadFile = File(...),
):
    """Upload a PDF and cache its extracted text for the student."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:  # 20 MB limit
        raise HTTPException(status_code=413, detail="PDF too large (max 20 MB).")

    text, pages = _extract_text(contents)

    if not text:
        raise HTTPException(status_code=422, detail="PDF appears to have no extractable text (may be scanned).")

    _pdf_cache[student_id] = {
        "filename": file.filename,
        "text": text,
        "pages": pages,
        "word_count": len(text.split()),
    }

    return {
        "status": "success",
        "filename": file.filename,
        "pages": pages,
        "word_count": len(text.split()),
        "preview": text[:400] + ("..." if len(text) > 400 else ""),
    }


class PDFQuizRequest(BaseModel):
    student_id: str = "default"
    num_questions: int = 5


@router.post("/quiz")
def quiz_from_pdf(req: PDFQuizRequest):
    """Generate quiz questions based on the student's uploaded PDF."""
    cached = _pdf_cache.get(req.student_id)
    if not cached:
        raise HTTPException(status_code=404, detail="No PDF uploaded. Please upload a PDF first.")

    # Truncate text to avoid token overload — use first ~4000 words
    words = cached["text"].split()
    excerpt = " ".join(words[:4000])
    filename = cached["filename"]

    profile = caretaker.get_profile(req.student_id)
    context = profile.get_context_summary()

    topic = f"PDF: {filename}"
    questions = generate_quiz(
        topic=topic,
        num_questions=req.num_questions,
        context=context,
        pdf_text=excerpt,
    )

    _quiz_answer_cache[f"{req.student_id}::{topic}"] = questions

    profile.add_topic(filename)
    caretaker.checkpoint(req.student_id)

    client_questions = [
        {"id": i, "question": q["question"], "options": q["options"]}
        for i, q in enumerate(questions)
    ]

    return {
        "topic": topic,
        "filename": filename,
        "questions": client_questions,
        "total": len(client_questions),
    }


class PDFSummaryRequest(BaseModel):
    student_id: str = "default"


@router.post("/summary")
def summarize_pdf(req: PDFSummaryRequest):
    """Generate a structured summary of the uploaded PDF."""
    cached = _pdf_cache.get(req.student_id)
    if not cached:
        raise HTTPException(status_code=404, detail="No PDF uploaded. Please upload a PDF first.")

    words = cached["text"].split()
    excerpt = " ".join(words[:5000])
    filename = cached["filename"]

    summary = generate_summary(topics=[filename], context=excerpt, is_pdf=True)

    return {
        "filename": filename,
        "pages": cached["pages"],
        "summary": summary,
    }


def get_pdf_quiz_cache() -> dict:
    """Expose internal quiz cache for cross-route answer validation."""
    return _quiz_answer_cache
