# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **teacher practice and simulation tool** where teachers upload PowerPoint/PDF slides, configure a simulated student profile, and practice teaching by speaking to the slides.

**The AI roleplays as a student**, not an assistant. It asks questions, provides feedback on the teaching, and responds to the teacher's explanations based on the configured student characteristics:
- Grade level (elementary through college)
- Understanding level (struggling, on-level, advanced, gifted)
- Learning style preference (concise, step-by-step, examples, analogies, socratic)
- Personality/persona (curious, quiet, distracted, confident, skeptical)

Teachers use **voice recording** to speak during their lesson, and the system transcribes their speech and generates realistic student responses via OpenAI LLM.

The system uses a **stateless FastAPI backend** with a React + TypeScript frontend.

## Architecture Principles

### Stateless Backend Design
The backend is intentionally stateless—it stores **no session data**. All session state (current slide index, student profile, conversation history, teacher transcription) lives in the frontend. The backend only:
- Converts uploaded slides to images and stores them on disk
- Provides stateless AI feedback endpoints

### Key Architectural Pattern
On each teacher utterance (via voice recording), the frontend:
1. Transcribes speech to text using the browser's Web Speech API
2. Sends the **complete context** to `/feedback`:
   - `teacher_text`: transcribed teacher speech
   - `slide_index`: which slide is being taught
   - `slide_text`: optional extracted text from slide (currently unused)
   - `student_profile`: student characteristics for personalized student responses
   - `history`: entire conversation history (currently unused in the simplified implementation)

The backend uses OpenAI to generate realistic **student responses** (questions, confusion, understanding, feedback) based on the student profile, and returns it without storing anything.

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
- Accepts: `{"teacher_text": "...", "slide_index": 1}` (minimal implementation)
  - Note: Full implementation would include `student_profile` and `history` for context-aware responses
- Process: Currently acknowledges receipt; will call OpenAI LLM with student persona prompt template
- Returns: `{"status": "received"}` (will be `{"student_feedback": "..."}` when LLM is integrated)
- **No state persisted** - completely stateless

## Frontend Responsibilities

The frontend is the source of truth for all session state:
- Upload file and store response (`upload_id`, `slides[]`)
- Track current slide index (navigation is frontend-only, no backend call needed)
- Manage student profile configuration (grade level, subject, understanding level, learning style, persona)
- Maintain complete conversation history (teacher utterances and student responses)
- Handle **voice recording and speech-to-text transcription** using Web Speech API
- Send stateless requests to `/feedback` with transcribed teacher speech
- Display slide images from backend URLs
- Show simulated student responses in a chat interface

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
The system uses OpenAI to generate realistic student responses:
- Uses `chatbot.py` to wrap OpenAI API calls
- Accepts teacher utterance, slide context, student profile
- Generates **student persona responses** (not teaching feedback) - questions, confusion, understanding, engagement
- Prompt engineering creates authentic student behaviors based on:
  - Grade level (elementary student vs college student language)
  - Understanding level (struggling students need more help, gifted students ask deeper questions)
  - Learning style (some prefer examples, others prefer step-by-step)
  - Personality (curious students ask many questions, quiet students speak less, distracted students lose focus)

### State Management Best Practices
- **Backend**: Keep endpoints pure functions—no global state, no sessions
- **Frontend**: Use React state/context to manage session
- Never assume backend remembers previous requests
- Always send complete context in each API call
