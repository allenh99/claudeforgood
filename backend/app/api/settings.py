"""
Settings API endpoint for managing student profile configuration.
Stores settings in a JSON file in the data folder.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json
from typing import Optional

router = APIRouter()

# Path to settings file
SETTINGS_FILE = Path(__file__).parent.parent.parent / "data" / "settings.json"


class SettingsRequest(BaseModel):
    """Request body for updating settings."""
    grade_level: str
    subject: str
    understanding_level: str
    explanation_style: str
    student_persona: str


class SettingsResponse(BaseModel):
    """Response from settings endpoint."""
    message: str
    settings: SettingsRequest


@router.post("/settings", response_model=SettingsResponse)
async def save_settings(settings: SettingsRequest):
    """
    Save or update student profile settings in a JSON file.

    Args:
        settings: SettingsRequest containing all configuration parameters

    Returns:
        SettingsResponse with confirmation message and saved settings

    Raises:
        HTTPException: If file operations fail
    """
    try:
        # Ensure data directory exists
        SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)

        # Convert settings to dict
        settings_dict = settings.model_dump()

        # Write to JSON file (overwrites if exists)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings_dict, f, indent=2)

        action = "updated" if SETTINGS_FILE.exists() else "created"

        return SettingsResponse(
            message=f"Settings {action} successfully",
            settings=settings
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save settings: {str(e)}"
        )


@router.get("/settings", response_model=Optional[SettingsRequest])
async def get_settings():
    """
    Retrieve current settings from JSON file.

    Returns:
        SettingsRequest with current settings, or None if no settings exist

    Raises:
        HTTPException: If file read fails
    """
    try:
        if not SETTINGS_FILE.exists():
            return None

        with open(SETTINGS_FILE, 'r') as f:
            settings_dict = json.load(f)

        return SettingsRequest(**settings_dict)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Settings file is corrupted"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read settings: {str(e)}"
        )
