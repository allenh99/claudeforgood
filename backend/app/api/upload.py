"""
Upload API endpoint for handling slide file uploads.
Converts PPTX/PDF files to PNG images and returns slide metadata.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
from pathlib import Path
import shutil

from app.core.slide_converter import SlideConverter

router = APIRouter()

# Initialize slide converter
IMAGES_DIR = Path(__file__).parent.parent.parent / "data" / "images"
UPLOADS_DIR = Path(__file__).parent.parent.parent / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

slide_converter = SlideConverter(IMAGES_DIR)


class SlideInfo(BaseModel):
    """Information about a single slide."""
    index: int
    image_url: str


class UploadResponse(BaseModel):
    """Response from the upload endpoint."""
    slides: List[SlideInfo]
    message: str


@router.post("/upload", response_model=UploadResponse)
async def upload_slides(file: UploadFile = File(...)):
    """
    Upload a PowerPoint (PPTX) or PDF file and convert it to slide images.
    Clears previous uploads and stores slides directly in data/images/.

    Args:
        file: The uploaded PPTX or PDF file

    Returns:
        UploadResponse with list of slide image URLs

    Raises:
        HTTPException: If file type is unsupported or conversion fails
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ['.pdf', '.pptx', '.ppt']:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Only .pdf, .pptx, and .ppt files are allowed."
        )

    try:
        # Read file content
        file_content = await file.read()

        # Clear and reset uploads directory
        if UPLOADS_DIR.exists():
            shutil.rmtree(UPLOADS_DIR)
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

        # Save original file to uploads directory
        original_file_path = UPLOADS_DIR / file.filename
        with open(original_file_path, 'wb') as f:
            f.write(file_content)

        # Convert file to PNG images (this also clears the images directory)
        image_paths = slide_converter.convert_file(file_content, file.filename)

        # Build response with image URLs
        slides = []
        for idx, image_path in enumerate(image_paths):
            # Construct URL path for accessing the image
            # Format: /images/slide_000.png
            image_url = f"/images/{image_path.name}"

            slides.append(SlideInfo(
                index=idx,
                image_url=image_url
            ))

        return UploadResponse(
            slides=slides,
            message=f"Successfully uploaded and converted {len(slides)} slides"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {str(e)}"
        )
    finally:
        await file.close()
