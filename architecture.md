# architecture.md

## Overview

A React + TypeScript frontend interacts with a stateless FastAPI
backend.\
Teachers upload a PowerPoint/PDF, customize student profiles, speak
during a simulated lesson, and receive AI-generated feedback.\
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

        -   current slide index\
        -   student profile\
        -   conversation history\
        -   teacher speech transcription\

    -   On each teacher utterance, frontend calls `/feedback` with:

        ``` json
        {
          "teacher_text": "...",
          "slide_index": 1,
          "slide_text": "...optional text...",
          "student_profile": {...},
          "history": [...]
        }
        ```

    -   Backend generates student-like feedback via LLM.

    -   Backend stores nothing about the interaction.
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

-   Accepts teacher_text, slide_index, slide_text (optional),
    student_profile, and history

-   Calls LLM engine with prompt template

-   Returns JSON:

    ``` json
    {"student_feedback": "..."}
    ```

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
    -   upload_id\
    -   slides array\
    -   currentSlideIndex\
    -   studentProfile\
    -   conversationHistory\
-   Handle audio → text transcription
-   Send feedback requests to backend
-   Display slide images (via image URLs)
-   No backend session required

### API Calls

-   `POST /upload`
-   `POST /feedback`
-   `POST /settings` - Save student profile configuration
-   `GET /settings` - Retrieve saved configuration
