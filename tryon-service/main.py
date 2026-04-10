"""
Virtual Try-On Service — FastAPI application.

Accepts a selfie image and earring image URL(s), detects facial landmarks
using MediaPipe Face Landmarker, composites earrings at the earlobe positions,
and returns the result as a JPEG image.

Run locally:
    uvicorn main:app --reload --port 8000
"""

import io
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import Response
from PIL import Image

from face_detection import detect_face
from earring_renderer import EarringAsset, fetch_earring_image, render_earrings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Maximum selfie size: 10 MB
MAX_SELFIE_BYTES = 10 * 1024 * 1024
# Maximum image dimension after resize
MAX_IMAGE_DIM = 1280


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up the face landmarker model on startup."""
    logger.info("Warming up Face Landmarker model...")
    # Create a tiny dummy image to trigger model loading
    dummy = Image.new("RGB", (100, 100), color=(128, 128, 128))
    detect_face(dummy)
    logger.info("Face Landmarker model ready.")
    yield


app = FastAPI(
    title="Earring Virtual Try-On Service",
    version="1.0.0",
    lifespan=lifespan,
)


def _resize_if_needed(image: Image.Image) -> Image.Image:
    """Resize image if either dimension exceeds MAX_IMAGE_DIM."""
    w, h = image.size
    if w <= MAX_IMAGE_DIM and h <= MAX_IMAGE_DIM:
        return image
    ratio = min(MAX_IMAGE_DIM / w, MAX_IMAGE_DIM / h)
    new_size = (int(w * ratio), int(h * ratio))
    return image.resize(new_size, Image.LANCZOS)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/tryon/render")
async def render_tryon(
    selfie: UploadFile = File(..., description="Selfie image (JPEG/PNG)"),
    earring_url: str = Form(..., description="URL of earring image"),
    right_earring_url: str = Form("", description="URL of right earring image (optional, mirrors left if empty)"),
    real_world_width: float = Form(20.0, description="Earring width in mm"),
    real_world_height: float = Form(30.0, description="Earring height in mm"),
    anchor_x: float = Form(0.5, description="Horizontal anchor point 0-1"),
    anchor_y: float = Form(0.1, description="Vertical anchor point 0-1 (0=top)"),
):
    """
    Process a virtual try-on request.

    1. Read and validate the selfie image
    2. Download the earring image(s) from the provided URL(s)
    3. Detect face landmarks using MediaPipe Face Landmarker
    4. Composite earrings at detected earlobe positions
    5. Return the result as JPEG
    """
    # --- 1. Read selfie -------------------------------------------------------
    selfie_bytes = await selfie.read()
    if len(selfie_bytes) > MAX_SELFIE_BYTES:
        raise HTTPException(status_code=400, detail="Selfie image too large (max 10MB)")

    try:
        selfie_img = Image.open(io.BytesIO(selfie_bytes))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    selfie_img = _resize_if_needed(selfie_img)
    logger.info("Selfie loaded: %dx%d", selfie_img.width, selfie_img.height)

    # --- 2. Download earring image(s) -----------------------------------------
    try:
        left_earring = await fetch_earring_image(earring_url)
    except Exception as e:
        logger.error("Failed to fetch earring image: %s", e)
        raise HTTPException(status_code=400, detail=f"Failed to download earring image: {e}")

    if right_earring_url and right_earring_url.strip():
        try:
            right_earring = await fetch_earring_image(right_earring_url)
        except Exception as e:
            logger.warning("Failed to fetch right earring, using mirrored left: %s", e)
            right_earring = left_earring
    else:
        right_earring = left_earring  # Will be mirrored by renderer

    # --- 3. Detect face -------------------------------------------------------
    face = detect_face(selfie_img)
    if face is None:
        raise HTTPException(
            status_code=422,
            detail="No face detected. Please use a clear, front-facing photo.",
        )

    logger.info(
        "Face detected — left ear: (%.0f, %.0f), right ear: (%.0f, %.0f), "
        "face width: %.0fpx, roll: %.1f°",
        face.left_ear.x, face.left_ear.y,
        face.right_ear.x, face.right_ear.y,
        face.face_width_px, face.face_rotation.roll,
    )

    # --- 4. Render earrings ---------------------------------------------------
    asset = EarringAsset(
        left_image=left_earring,
        right_image=right_earring,
        real_world_width_mm=real_world_width,
        real_world_height_mm=real_world_height,
        anchor_x=anchor_x,
        anchor_y=anchor_y,
    )

    try:
        result_bytes = render_earrings(selfie_img, face, asset)
    except Exception as e:
        logger.error("Rendering failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to render earrings")

    logger.info("Render complete — %d bytes", len(result_bytes))

    # --- 5. Return JPEG -------------------------------------------------------
    return Response(content=result_bytes, media_type="image/jpeg")
