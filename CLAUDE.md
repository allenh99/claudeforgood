# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a teaching simulation tool where teachers upload PowerPoint/PDF slides, customize student profiles, speak during a simulated lesson, and receive AI-generated feedback. The system uses a **stateless FastAPI backend** with a React + TypeScript frontend.

## Architecture Principles

### Stateless Backend Design
The backend is intentionally stateless—it stores **no session data**. All session state (current slide index, student profile, conversation history, teacher transcription) lives in the frontend. The backend only:
- Converts uploaded slides to images and stores them on disk
- Provides stateless AI feedback endpoints

### Key Architectural Pattern
On each teacher utterance, the frontend sends the **complete context** to `/feedback`:
- `teacher_text`: current utterance
- `slide_index`: which slide is being taught
- `slide_text`: optional extracted text from slide
- `student_profile`: student characteristics for personalized feedback
- `history`: entire conversation history

The backend generates student-like feedback via LLM and returns it without storing anything.

## Planned Directory Structure

```
backend/
  app/
    main.py                  # FastAPI app entry point
    api/
      upload.py              # POST /upload endpoint
      feedback.py            # POST /feedback endpoint
    core/
      slide_converter.py     # PowerPoint/PDF → PNG images
      llm_engine.py          # LLM provider wrapper
  data/
    images/<upload_id>/      # Converted slide images (slide_000.png, etc.)
    uploads/                 # Raw uploaded PPTX/PDF files

frontend/
  src/
    # React + TypeScript app
    # Manages: upload_id, slides[], currentSlideIndex,
    #          studentProfile, conversationHistory
    # Handles: audio transcription, API calls, slide display
```

## Backend Endpoints

### `POST /upload`
- Accepts: PPTX or PDF file (`UploadFile`)
- Process: Saves temp file → converts to PNG images → stores in `data/images/<upload_id>/`
- Returns: `{"upload_id": "<uuid>", "slides": [{"index": 0, "image_url": "/images/<upload_id>/slide_000.png"}, ...]}`
- Static files served via: `app.mount("/images", StaticFiles(directory="data/images"), name="images")`

### `POST /feedback`
- Accepts: `{"teacher_text": "...", "slide_index": 1, "slide_text": "...", "student_profile": {...}, "history": [...]}`
- Process: Calls LLM engine with prompt template
- Returns: `{"student_feedback": "..."}`
- **No state persisted**

## Frontend Responsibilities

The frontend is the source of truth for all session state:
- Upload file and store response (`upload_id`, `slides[]`)
- Track current slide index (navigation is frontend-only, no backend call needed)
- Manage student profile configuration
- Maintain complete conversation history
- Handle audio → text transcription
- Send stateless requests to `/feedback` with full context each time
- Display slide images from backend URLs

## Development Notes

### Backend Setup
The backend will use FastAPI. Expected setup commands (to be confirmed once implemented):
```bash
cd backend
pip install -r requirements.txt  # or use poetry/pipenv
uvicorn app.main:app --reload
```

### Frontend Setup
The frontend will use React + TypeScript. Expected setup commands (to be confirmed once implemented):
```bash
cd frontend
npm install
npm start
```

### Slide Converter Implementation
When implementing `core/slide_converter.py`:
- For PPTX: Use a library like `python-pptx` + `Pillow` or `pdf2image` (after converting PPTX→PDF)
- For PDF: Use `pdf2image` or similar
- Save each slide as `slide_000.png`, `slide_001.png`, etc. in `data/images/<upload_id>/`
- Generate unique `upload_id` using `uuid.uuid4()`

### LLM Engine Implementation
When implementing `core/llm_engine.py`:
- Wrap calls to LLM provider (OpenAI, Anthropic, etc.)
- Accept teacher utterance, slide context, student profile, and history
- Generate student-like feedback based on teaching effectiveness
- Consider prompt engineering for realistic student responses

### State Management Best Practices
- **Backend**: Keep endpoints pure functions—no global state, no sessions
- **Frontend**: Use React state/context to manage session
- Never assume backend remembers previous requests
- Always send complete context in each API call
