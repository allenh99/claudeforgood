# architecture.md

## Overview

A React + TypeScript frontend interacts with a stateless FastAPI backend.

**This is a teacher practice tool**: Teachers upload PowerPoint/PDF slides, configure a simulated student profile, and practice teaching by speaking to the slides. The AI **roleplays as a student** - asking questions, expressing confusion or understanding, and responding based on the configured student characteristics (grade level, understanding level, learning style, personality).

Teachers use **voice recording** to speak during their lesson. The browser transcribes speech to text, and the backend generates realistic student responses via OpenAI.

The backend stores only slide images on disk---**no session data**.

## High-Level Flow

1.  **Upload Slides**
    -   Frontend sends a PPTX/PDF to `/upload`.

    -   Backend converts each slide to a PNG.

    -   Backend stores slide images under `data/images/<upload_id>/`.

    -   Backend returns:

        ``` json
        {
          "upload_id": "<uuid>",
          "slides": [
            {"index": 0, "image_url": "/images/<upload_id>/slide_000.png"},
            ...
          ]
        }
        ```

    -   Frontend stores the response locally.
2.  **Teaching Simulation (Stateless)**
    -   Frontend handles:
        -   current slide index
        -   student profile configuration
        -   conversation history (teacher speech + student responses)
        -   **voice recording and speech-to-text transcription** (Web Speech API)

    -   Teacher clicks record button, speaks, clicks stop

    -   Speech is transcribed to text automatically in the browser

    -   Frontend calls `/feedback` with:

        ``` json
        {
          "teacher_text": "transcribed teacher speech",
          "slide_index": 1
        }
        ```

        (Minimal implementation; full version would include `student_profile` and `history`)

    -   Backend generates **student persona responses** via OpenAI LLM
        - Not teaching feedback, but authentic student reactions
        - Based on configured grade level, understanding level, learning style, personality

    -   Student response appears in chat interface

    -   Backend stores nothing about the interaction
3.  **Next Slide**
    -   Frontend updates local state only.
    -   No backend call required.

## Backend Architecture (FastAPI)

    app/
      main.py
      api/
        upload.py        # /upload route
        feedback.py      # /feedback route
        settings.py      # /settings route
      core/
        slide_converter.py   # ppt/pdf → images
        llm_engine.py        # wrapper around LLM provider
    data/
      images/               # <upload_id>/slide_000.png
      uploads/              # raw uploaded files
      settings.json         # student profile settings

### Endpoints

#### `POST /upload`

-   Accepts PPTX/PDF (`UploadFile`)
-   Saves temp file → converts to images → stores under
    `data/images/<upload_id>/`
-   Returns slide image URLs + upload_id\
-   Stateless aside from writing files

#### `POST /feedback`

-   Accepts minimal payload: `teacher_text` (transcribed speech) and `slide_index`
    - Full implementation would include `student_profile` and `history` for context

-   Calls OpenAI LLM with student persona prompt template

-   Generates **realistic student responses** (questions, confusion, understanding, engagement)
    - NOT teaching feedback or evaluation
    - Authentic student behavior based on profile

-   Returns JSON:

    ``` json
    {"status": "received"}
    ```

    (Will be `{"student_feedback": "..."}` when fully integrated)

#### `POST /settings`

-   Accepts student profile configuration:

    ``` json
    {
      "grade_level": "...",
      "subject": "...",
      "understanding_level": "...",
      "explanation_style": "...",
      "student_persona": "..."
    }
    ```

-   Stores settings in `data/settings.json` (creates or updates)

-   Returns confirmation and saved settings

#### `GET /settings`

-   Retrieves current settings from `data/settings.json`

-   Returns settings object or `null` if no settings exist

### Static Files

`main.py` mounts:

``` python
app.mount("/images", StaticFiles(directory="data/images"), name="images")
```

## Frontend Architecture (React + TypeScript)

### Responsibilities

-   Upload file → receive slide URLs
-   Maintain local state:
    -   upload_id
    -   slides array
    -   currentSlideIndex
    -   studentProfile (grade, subject, understanding level, learning style, persona)
    -   conversationHistory (teacher utterances + student responses)
-   **Voice recording and speech-to-text** using Web Speech API
    -   AudioRecorder component handles recording start/stop
    -   Browser's native speech recognition transcribes audio
    -   Automatic submission to `/feedback` when recording stops
-   Send feedback requests to backend with transcribed teacher speech
-   Display slide images (via image URLs)
-   Show simulated student responses in chat interface
-   No backend session required - frontend is source of truth

### API Calls

-   `POST /upload`
-   `POST /feedback`
-   `POST /settings` - Save student profile configuration
-   `GET /settings` - Retrieve saved configuration
