"""
Slide converter: converts PowerPoint (PPTX) and PDF files to PNG images.
Each slide becomes a separate PNG file.
"""
import uuid
from pathlib import Path
from typing import List, Tuple
import io

from pptx import Presentation
from pdf2image import convert_from_path, convert_from_bytes
from PIL import Image


class SlideConverter:
    """Converts presentation files to individual slide images."""

    def __init__(self, images_base_dir: Path):
        """
        Initialize the slide converter.

        Args:
            images_base_dir: Base directory where slide images will be stored
        """
        self.images_base_dir = Path(images_base_dir)
        self.images_base_dir.mkdir(parents=True, exist_ok=True)

    def convert_file(self, file_content: bytes, filename: str) -> List[Path]:
        """
        Convert an uploaded file to PNG images.
        Clears existing images and saves directly to the base images directory.

        Args:
            file_content: Raw bytes of the uploaded file
            filename: Original filename (used to determine file type)

        Returns:
            List of image file paths

        Raises:
            ValueError: If file type is not supported
        """
        import shutil

        # Clear existing images
        if self.images_base_dir.exists():
            shutil.rmtree(self.images_base_dir)
        self.images_base_dir.mkdir(parents=True, exist_ok=True)

        file_ext = Path(filename).suffix.lower()

        if file_ext == '.pdf':
            image_paths = self._convert_pdf(file_content, self.images_base_dir)
        elif file_ext in ['.pptx', '.ppt']:
            image_paths = self._convert_pptx(file_content, self.images_base_dir)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}. Only .pdf, .pptx, and .ppt are supported.")

        return image_paths

    def _convert_pdf(self, file_content: bytes, output_dir: Path) -> List[Path]:
        """
        Convert PDF to PNG images.

        Args:
            file_content: Raw PDF bytes
            output_dir: Directory to save PNG files

        Returns:
            List of paths to generated PNG files
        """
        try:
            # Try to convert PDF pages to images
            images = convert_from_bytes(
                file_content,
                dpi=300,  # High quality
                fmt='png'
            )

            image_paths = []
            for idx, img in enumerate(images):
                output_path = output_dir / f"slide_{idx:03d}.png"
                img.save(output_path, 'PNG')
                image_paths.append(output_path)

            return image_paths
        except Exception as e:
            # Provide helpful error message if poppler is not installed
            error_msg = str(e)
            if "poppler" in error_msg.lower() or "unable to get page count" in error_msg.lower():
                raise RuntimeError(
                    "Poppler is not installed or not in PATH. "
                    "Install it with: brew install poppler (macOS) or apt-get install poppler-utils (Ubuntu)"
                ) from e
            raise

    def _convert_pptx(self, file_content: bytes, output_dir: Path) -> List[Path]:
        """
        Convert PowerPoint (PPTX) to PNG images.

        Uses LibreOffice in headless mode to convert PPTX -> PDF -> PNG.

        Args:
            file_content: Raw PPTX bytes
            output_dir: Directory to save PNG files

        Returns:
            List of paths to generated PNG files
        """
        import subprocess
        import shutil

        # Save PPTX temporarily for processing
        temp_pptx = output_dir / "temp.pptx"
        with open(temp_pptx, 'wb') as f:
            f.write(file_content)

        # Check if LibreOffice is installed
        libreoffice_cmd = None
        for cmd in ['libreoffice', 'soffice']:
            if shutil.which(cmd):
                libreoffice_cmd = cmd
                break

        if not libreoffice_cmd:
            temp_pptx.unlink()
            raise RuntimeError(
                "LibreOffice is not installed or not in PATH. "
                "Install it with: brew install libreoffice (macOS) or apt-get install libreoffice (Ubuntu). "
                "LibreOffice is required to convert PowerPoint files to images."
            )

        try:
            # Convert PPTX -> PDF using LibreOffice
            temp_pdf = output_dir / "temp.pdf"

            result = subprocess.run(
                [
                    libreoffice_cmd,
                    '--headless',
                    '--convert-to', 'pdf',
                    '--outdir', str(output_dir),
                    str(temp_pptx)
                ],
                capture_output=True,
                timeout=60,
                text=True
            )

            if result.returncode != 0:
                raise RuntimeError(f"LibreOffice conversion failed: {result.stderr}")

            if not temp_pdf.exists():
                raise RuntimeError("LibreOffice conversion did not produce a PDF file")

            # Successfully converted to PDF, now convert PDF to images
            with open(temp_pdf, 'rb') as f:
                pdf_content = f.read()

            image_paths = self._convert_pdf(pdf_content, output_dir)

            # Clean up temp files
            temp_pptx.unlink()
            temp_pdf.unlink()

            return image_paths

        except subprocess.TimeoutExpired:
            temp_pptx.unlink()
            raise RuntimeError("LibreOffice conversion timed out (>60 seconds)")
        except Exception as e:
            # Clean up temp file if it exists
            if temp_pptx.exists():
                temp_pptx.unlink()
            raise
