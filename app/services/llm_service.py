import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "phi3-local"


def _call_ollama(prompt: str, json_format: bool = False) -> str:
    try:
        payload = {"model": MODEL, "prompt": prompt, "stream": False, "options": {"temperature": 0.1}}
        if json_format:
            payload["format"] = "json"

        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=300,
        )
        data = response.json()
        return data.get("response", "No response")
    except Exception as e:
        return f"Error contacting Ollama: {str(e)}"


def generate_response(question: str, context: str = "", extra_resources: str = "") -> str:
    """Generate a tutor explanation, injecting student memory context."""
    parts = ["You are LearnMate AI, an adaptive AI tutor. Be clear and engaging."]
    if context:
        parts.append(f"Student context: {context}")
    if extra_resources:
        parts.append(f"Additional reference material:\n{extra_resources}")
    parts.append(f"Student question: {question}")
    parts.append("Provide a well-structured, educational explanation.")
    return _call_ollama("\n\n".join(parts))


def generate_summary(topics: list[str], context: str = "", is_pdf: bool = False) -> str:
    """Generate a personalized summary of topics the student has covered."""
    topic_list = ", ".join(topics) if topics else "general concepts"

    if is_pdf:
        prompt = (
            "You are LearnMate AI, an expert educational AI tutor.\n"
            "A student has uploaded a PDF document. Your job is to produce a clear, structured, and engaging summary of its content.\n"
            f"Document name: {topic_list}\n\n"
            "PDF Content (excerpt):\n"
            f"{context}\n\n"
            "Write the summary in the following format (use these exact section headings):\n"
            "## Overview\n"
            "A concise 2-3 sentence description of what this document covers.\n\n"
            "## Key Concepts\n"
            "List the 5-8 most important concepts or ideas as bullet points (start each with •).\n\n"
            "## Key Takeaways\n"
            "3-5 actionable bullet points the student should remember.\n\n"
            "## Why It Matters\n"
            "A short paragraph on the real-world relevance of this material.\n\n"
            "Keep the tone encouraging and educational. Do not output JSON or code."
        )
    else:
        prompt = (
            "You are LearnMate AI, an expert educational AI tutor.\n"
            "Generate a comprehensive, structured revision summary for the student based on topics they have studied.\n"
            f"Topics studied: {topic_list}\n"
            f"Student learning context: {context}\n\n"
            "Write the summary in the following format (use these exact section headings):\n"
            "## Study Session Overview\n"
            "A brief 2-3 sentence recap of what the student has been studying.\n\n"
            "## Core Concepts Covered\n"
            "List the main ideas as bullet points (start each with •).\n\n"
            "## Key Takeaways\n"
            "3-5 bullet points the student must remember.\n\n"
            "## Areas to Review\n"
            "Based on quiz mistakes and weak topics, suggest what to study next.\n\n"
            "## Why It Matters\n"
            "A short motivating paragraph on the real-world importance of this material.\n\n"
            "Keep the tone encouraging. Do not output JSON or code."
        )
    return _call_ollama(prompt)


def generate_quiz(topic: str, num_questions: int = 5, context: str = "", pdf_text: str = "") -> list[dict]:
    """
    Generate MCQ quiz questions for a topic.
    If pdf_text is provided, questions are drawn from the PDF content.
    Returns a list of dicts:
      { "question": str, "options": [A, B, C, D], "answer": "A"|"B"|"C"|"D", "explanation": str }
    """
    if pdf_text:
        content_section = (
            f"Use the following document content as the source for your questions:\n"
            f"--- BEGIN DOCUMENT ---\n{pdf_text[:3500]}\n--- END DOCUMENT ---\n"
        )
        topic_line = f"Generate a multiple-choice quiz based on the document content above."
    else:
        content_section = ""
        topic_line = f"Generate a multiple-choice quiz about the topic: '{topic}'."

    prompt = (
        f"You are LearnMate AI, an expert educational AI tutor.\n"
        f"{topic_line}\n"
        f"{content_section}"
        f"Student context: {context}\n\n"
        f"Generate exactly {num_questions} multiple-choice questions.\n"
        "Output each question EXACTLY in the following format:\n"
        "Question: <question text>\n"
        "A) <option A>\n"
        "B) <option B>\n"
        "C) <option C>\n"
        "D) <option D>\n"
        "Answer: <A, B, C, or D>\n"
        "Explanation: <explanation text>\n\n"
        "Do not include any other text, JSON, or formatting."
    )
    
    raw = _call_ollama(prompt, json_format=False)

    validated = []
    
    pattern = re.compile(
        r"Question:\s*(.*?)\s*"
        r"A\)\s*(.*?)\s*"
        r"B\)\s*(.*?)\s*"
        r"C\)\s*(.*?)\s*"
        r"D\)\s*(.*?)\s*"
        r"Answer:\s*([A-D])\s*"
        r"Explanation:\s*(.*?)(?=Question:|$)", 
        re.IGNORECASE | re.DOTALL
    )
    
    matches = pattern.findall(raw)
    for match in matches:
        q_text, opt_a, opt_b, opt_c, opt_d, ans, exp = match
        validated.append({
            "question": q_text.strip(),
            "options": [opt_a.strip(), opt_b.strip(), opt_c.strip(), opt_d.strip()],
            "answer": ans.strip().upper(),
            "explanation": exp.strip()
        })
        
    if len(validated) > 0:
        return validated[:num_questions]

    return _fallback_quiz(topic, num_questions)


def evaluate_answer(question: str, selected: str, correct: str, explanation: str) -> dict:
    """Return structured evaluation of a student's answer."""
    is_correct = selected.strip().upper() == correct.strip().upper()
    return {
        "is_correct": is_correct,
        "correct_answer": correct,
        "explanation": explanation,
        "feedback": "Great job! ✓" if is_correct else f"Not quite. The correct answer is {correct}. {explanation}",
    }


def _fallback_quiz(topic: str, n: int) -> list[dict]:
    """Return a minimal fallback so the route never crashes."""
    return [
        {
            "question": f"What is a key concept in {topic}?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "A",
            "explanation": "Could not generate quiz — check that Ollama is running.",
        }
        for _ in range(n)
    ]