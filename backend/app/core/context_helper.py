from pathlib import Path
from typing import Dict


def render_context_from_settings(settings: Dict[str, str]) -> None:
    """
    Render the backend/context.txt file by substituting placeholders
    with values from the provided settings dict.

    Expected placeholders in the template:
      <persona>, <grade>, <subject>, <level>, <style>
    """
    # Locate the context template (backend/context.txt)
    context_path = Path(__file__).parent.parent.parent / "context.txt"
    if not context_path.exists():
        # Nothing to do if the template doesn't exist
        return

    template = context_path.read_text()

    # Map placeholders to settings keys
    replacements = {
        "<persona>": settings.get("student_persona", ""),
        "<grade>": settings.get("grade_level", ""),
        "<subject>": settings.get("subject", ""),
        "<level>": settings.get("understanding_level", ""),
        "<style>": settings.get("explanation_style", ""),
    }

    rendered = template
    for placeholder, value in replacements.items():
        rendered = rendered.replace(placeholder, str(value))

    # Overwrite the context file with rendered content
    context_path.write_text(rendered)


