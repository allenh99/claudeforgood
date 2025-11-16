"""
Feedback API endpoint that accepts a transcript and slide index.
Currently returns an acknowledgement only (generation will be implemented later).
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import Optional
import json
import os
import sys

# Chatbot wrapper (lives at backend/chatbot.py)
# When running the FastAPI app (module 'app'), the parent directory is on sys.path
# so we can import 'chatbot' directly.
try:
    from chatbot import Chatbot  # type: ignore
except Exception as e:
    Chatbot = None  # fallback for environments without OpenAI configured

# Workflow loader for robust imports
from app.core.workflow_loader import load_workflow_module
#from ../../backend.workflow import get_feedback,add_slide,begin_conversation
#from workflow import get_feedback,add_slide,begin_conversation
current_dir = os.path.dirname(os.path.abspath(__file__))
utils_path = os.path.join(current_dir, '..','..','..','backend')
sys.path.append(utils_path)
import workflow
# Reuse the settings file path from the settings API
from app.api.settings import SETTINGS_FILE

router = APIRouter()


class FeedbackRequest(BaseModel):
    teacher_text: str
    slide_index: int
    slide_url: Optional[str] = None


class StudentFeedbackResponse(BaseModel):
    student_feedback: str
 
 
class SlideChangeRequest(BaseModel):
    slide_index: int
    slide_url: Optional[str] = None
 
 
class SlideChangeAck(BaseModel):
    status: str


@router.post("/feedback", response_model=StudentFeedbackResponse)
async def feedback(req: FeedbackRequest) -> StudentFeedbackResponse:
    """
    Accept a transcript (teacher_text) and slide_index, then generate a
    simulated student response using the Chatbot with context from settings.
    """
    try:
        # Load workflow module dynamically
        wf = load_workflow_module()
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

        # 3) Require a public slide URL (e.g., S3); do not use local paths
        if not req.slide_url or not isinstance(req.slide_url, str) or not req.slide_url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="slide_url is required and must be a publicly reachable URL (e.g., S3).")
        slide_url = req.slide_url

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

        # 5) Generate response and update history using workflow.get_feedback
        if wf is None or not hasattr(wf, "get_feedback"):
            raise RuntimeError("workflow.get_feedback is not available.")
        reply = wf.get_feedback(req.teacher_text)  # type: ignore

        return StudentFeedbackResponse(student_feedback=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to receive feedback: {str(e)}")


@router.post("/slide_change", response_model=SlideChangeAck)
async def slide_change(req: SlideChangeRequest) -> SlideChangeAck:
    """
    Record the slide change in the conversation history (if stateful workflow is available).
    """
    try:
        wf = load_workflow_module()
        if not req.slide_url or not isinstance(req.slide_url, str) or not req.slide_url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="slide_url is required and must be a publicly reachable URL (e.g., S3).")
        if wf and hasattr(wf, "add_slide"):
            wf.add_slide(req.slide_url)  # type: ignore
            return SlideChangeAck(status="ok")
        # If workflow is not available, no-op but succeed
        return SlideChangeAck(status="ignored")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record slide change: {str(e)}")
