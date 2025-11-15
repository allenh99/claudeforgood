"""
Feedback API endpoint for generating student-like responses.
Stateless: does not persist any conversation server-side.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

router = APIRouter()


class HistoryItem(BaseModel):
    sender: str  # "user" | "assistant"
    text: str


class StudentProfile(BaseModel):
    grade_level: str
    subject: str
    understanding_level: str
    explanation_style: str
    student_persona: str


class FeedbackRequest(BaseModel):
    teacher_text: str
    slide_index: int
    slide_text: Optional[str] = None
    student_profile: StudentProfile
    history: List[HistoryItem] = []


class FeedbackResponse(BaseModel):
    student_feedback: str


def _generate_placeholder_reply(req: FeedbackRequest) -> str:
    """
    Simple rule-based placeholder to simulate a student response without external LLMs.
    """
    persona_tone_map = {
        "curious": "I'm curious about this part. ",
        "quiet": "I'm not sure I follow. ",
        "distracted": "I kind of lost track. ",
        "confident": "I think I get it. ",
        "skeptical": "Are we sure about that? ",
    }

    tone = persona_tone_map.get(req.student_profile.student_persona, "")
    ask_for_more = "Could you explain it in a different way"
    if req.student_profile.explanation_style == "examples":
        ask_for_more = "Could you give an example"
    elif req.student_profile.explanation_style == "analogy":
        ask_for_more = "Could you share an analogy"
    elif req.student_profile.explanation_style == "socratic":
        ask_for_more = "Could you ask me a guiding question"
    elif req.student_profile.explanation_style == "step-by-step":
        ask_for_more = "Could you break it down step by step"

    slide_hint = ""
    if req.slide_text:
        slide_hint = " Based on the slide content, I notice: " + req.slide_text[:160] + ("..." if len(req.slide_text) > 160 else "")

    return (
        f"{tone}On slide {req.slide_index + 1}, I heard: \"{req.teacher_text}\"."
        f"{slide_hint} {ask_for_more} so I can better understand?"
    )


@router.post("/feedback", response_model=FeedbackResponse)
async def get_feedback(req: FeedbackRequest) -> FeedbackResponse:
    """
    Generate a student-like feedback message for the teacher_text, given slide context and profile.
    This placeholder implementation is deterministic and requires no API keys.
    """
    try:
        reply = _generate_placeholder_reply(req)
        return FeedbackResponse(student_feedback=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate feedback: {str(e)}")


