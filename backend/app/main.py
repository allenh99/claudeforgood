"""
FastAPI main application entry point.
Stateless backend for teaching simulation tool.
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app.api import upload, settings
from app.api import feedback


def reset_data_folder():
    """Clear the data folder on server startup."""
    data_dir = Path(__file__).parent.parent / "data"

    if data_dir.exists():
        print(f"Resetting data folder: {data_dir}")
        shutil.rmtree(data_dir)

    # Recreate the directory structure
    images_dir = data_dir / "images"
    uploads_dir = data_dir / "uploads"
    images_dir.mkdir(parents=True, exist_ok=True)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    print(f"Data folder reset complete")


# Reset data folder on startup
reset_data_folder()

# Create FastAPI app
app = FastAPI(
    title="Teaching Simulation API",
    description="Stateless API for teaching simulation with AI-generated student feedback",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(settings.router, prefix="/api", tags=["settings"])
app.include_router(feedback.router, prefix="/api", tags=["feedback"])

# Mount static files for serving slide images
images_dir = Path(__file__).parent.parent / "data" / "images"
app.mount("/images", StaticFiles(directory=str(images_dir)), name="images")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "Teaching Simulation API is running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "images_dir_exists": images_dir.exists(),
        "images_dir_path": str(images_dir)
    }
