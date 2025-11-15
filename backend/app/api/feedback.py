"""
Feedback API endpoint that accepts a transcript and slide index.
Currently returns an acknowledgement only (generation will be implemented later).
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import Optional
import json

# Chatbot wrapper (lives at backend/chatbot.py)
# When running the FastAPI app (module 'app'), the parent directory is on sys.path
# so we can import 'chatbot' directly.
try:
    from chatbot import Chatbot  # type: ignore
except Exception as e:
    Chatbot = None  # fallback for environments without OpenAI configured

# Reuse the settings file path from the settings API
from app.api.settings import SETTINGS_FILE

router = APIRouter()


class FeedbackRequest(BaseModel):
    teacher_text: str
    slide_index: int


class StudentFeedbackResponse(BaseModel):
    student_feedback: str


@router.post("/feedback", response_model=StudentFeedbackResponse)
async def feedback(req: FeedbackRequest) -> StudentFeedbackResponse:
    """
    Accept a transcript (teacher_text) and slide_index, then generate a
    simulated student response using the Chatbot with context from settings.
    """
    try:
        # 1) Load settings if present
        settings: Optional[dict] = None
        if SETTINGS_FILE.exists():
            with open(SETTINGS_FILE, "r") as f:
                settings = json.load(f)

        # 2) Build system prompt from context template
        context_path = Path(__file__).parent.parent.parent / "context.txt"
        system_prompt = "You are a teaching assistant simulating a student."
        if context_path.exists():
            template = context_path.read_text()
            if settings:
                # Map settings → placeholders
                system_prompt = (
                    template
                    .replace("<persona>", settings.get("student_persona", "curious"))
                    .replace("<grade>", settings.get("grade_level", "middle"))
                    .replace("<subject>", settings.get("subject", "general"))
                    .replace("<level>", settings.get("understanding_level", "on-level"))
                    .replace("<style>", settings.get("explanation_style", "step-by-step"))
                )
            else:
                system_prompt = template

        # 3) Construct slide image URL for current slide index
        # Slides are served from /images/slide_{index:03d}.png
        slide_url = f"/images/slide_{req.slide_index:03d}.png"

        # 4) Compose conversation with system, slide image, and teacher text
        conversation = [
            ("system", system_prompt),
            (
                "user",
                [
                    {
                        "type": "image_url",
                        "image_url": {"url": slide_url, "detail": "high"},
                    }
                ],
            ),
            ("user", req.teacher_text),
        ]

        # 5) Call Chatbot
        if Chatbot is None:
            raise RuntimeError("Chatbot is not available (OpenAI client not initialized).")
        bot = Chatbot()
        reply = bot.response(conversation, temperature=0.7, max_tokens=300)

        return StudentFeedbackResponse(student_feedback=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to receive feedback: {str(e)}")
