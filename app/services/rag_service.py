"""
RAG Service (Retrieval-Augmented Generation)
---------------------------------------------
Orchestrates:
  1. Retrieving web resources via Firecrawl (optional)
  2. Reading student memory context
  3. Passing both into the LLM to produce adapted responses
"""

from services.firecrawl_service import fetch_resources
from services.memory_service import caretaker
from services.llm_service import generate_response, generate_summary


def ask_with_rag(student_id: str, question: str, topic: str = "", use_web: bool = True) -> dict:
    """
    Full RAG pipeline for a student question.
    Returns { "answer": str, "resources_used": bool, "topic": str }
    """
    profile = caretaker.get_profile(student_id)

    # 1. Infer topic from question if not provided
    if not topic:
        # Use first noun-phrase-ish chunk as topic
        topic = question.split("?")[0].split(" about ")[-1].strip()[:60]

    # 2. Fetch external resources
    extra = ""
    resources_used = False
    if use_web:
        extra = fetch_resources(topic)
        resources_used = bool(extra)

    # 3. Build student context from memory
    context = profile.get_context_summary()

    # 4. Generate response
    answer = generate_response(question, context=context, extra_resources=extra)

    # 5. Update memory
    profile.add_topic(topic)
    profile.increment_questions()
    caretaker.checkpoint(student_id)

    return {
        "answer": answer,
        "resources_used": resources_used,
        "topic": topic,
    }


def summarize_with_rag(student_id: str) -> str:
    """Generate a personalized summary of what the student has covered."""
    profile = caretaker.get_profile(student_id)
    state = profile.get_state()
    topics = state.get("topics_covered", [])
    context = profile.get_context_summary()
    return generate_summary(topics, context=context)
