"""
Upload API endpoint for handling slide file uploads.
Converts PPTX/PDF files to PNG images and returns slide metadata.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import shutil
import os

from app.core.slide_converter import SlideConverter
from app.core.s3_uploader import S3Uploader

router = APIRouter()

# Initialize slide converter
IMAGES_DIR = Path(__file__).parent.parent.parent / "data" / "images"
UPLOADS_DIR = Path(__file__).parent.parent.parent / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

slide_converter = SlideConverter(IMAGES_DIR)

# Initialize S3 uploader (optional - only if AWS credentials are configured)
s3_uploader: Optional[S3Uploader] = None
try:
    if os.getenv("AWS_S3_BUCKET"):
        s3_uploader = S3Uploader()
        print("S3 uploader initialized successfully")
except Exception as e:
    print(f"S3 uploader not initialized: {e}")
    print("Images will only be stored locally")


class SlideInfo(BaseModel):
    """Information about a single slide."""
    index: int
    image_url: str
    s3_url: Optional[str] = None


class UploadResponse(BaseModel):
    """Response from the upload endpoint."""
    slides: List[SlideInfo]
    message: str
    stored_in_s3: bool = False


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

        # Upload to S3 if configured
        s3_urls = []
        stored_in_s3 = False
        if s3_uploader:
            try:
                # Clear previous slides from S3
                s3_uploader.clear_prefix("slides")

                # Upload new slides to S3
                s3_urls = s3_uploader.upload_files(image_paths, s3_prefix="slides")
                stored_in_s3 = True
                print(f"Successfully uploaded {len(s3_urls)} slides to S3")
            except Exception as e:
                print(f"Warning: Failed to upload to S3: {e}")
                print("Slides are still available locally")

        # Build response with image URLs
        slides = []
        for idx, image_path in enumerate(image_paths):
            # Construct local URL path
            # Format: /images/slide_000.png
            image_url = f"/images/{image_path.name}"

            # Get S3 URL if available
            s3_url = s3_urls[idx] if idx < len(s3_urls) else None

            slides.append(SlideInfo(
                index=idx,
                image_url=image_url,
                s3_url=s3_url
            ))

        message = f"Successfully uploaded and converted {len(slides)} slides"
        if stored_in_s3:
            message += " (stored in S3)"
        else:
            message += " (stored locally only)"

        return UploadResponse(
            slides=slides,
            message=message,
            stored_in_s3=stored_in_s3
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
