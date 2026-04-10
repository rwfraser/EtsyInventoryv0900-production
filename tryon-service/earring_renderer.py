"""
Server-side earring renderer using Pillow.

Downloads earring images from URLs, scales them to match the detected face
proportions, and composites them onto the selfie at the precise earlobe
positions returned by face_detection.detect_face().
"""

import io
import math
from dataclasses import dataclass

import httpx
from PIL import Image

from face_detection import FaceLandmarks


# Average human face width in mm (distance between eye outer corners ~ 90mm,
# but we use inter-ear distance proxy via eye corners which is ~65-70mm of the
# full bizygomatic width). We calibrate earring size relative to this.
AVERAGE_EYE_DISTANCE_MM = 65.0


@dataclass
class EarringAsset:
    left_image: Image.Image
    right_image: Image.Image
    real_world_width_mm: float   # Earring width in mm
    real_world_height_mm: float  # Earring height in mm
    anchor_x: float  # 0-1, horizontal attach point on earring image
    anchor_y: float  # 0-1, vertical attach point (0 = top hook)


async def fetch_earring_image(url: str) -> Image.Image:
    """Download an earring image from a URL and return as RGBA PIL Image."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    img = Image.open(io.BytesIO(resp.content))
    return img.convert("RGBA")


def _scale_earring(
    earring: Image.Image,
    face: FaceLandmarks,
    real_width_mm: float,
    real_height_mm: float,
) -> tuple[int, int]:
    """Calculate earring pixel dimensions based on face proportions."""
    # How many pixels per mm, derived from the detected face
    px_per_mm = face.face_width_px / AVERAGE_EYE_DISTANCE_MM
    earring_w = int(real_width_mm * px_per_mm)
    earring_h = int(real_height_mm * px_per_mm)
    # Clamp to reasonable bounds
    earring_w = max(10, min(earring_w, 500))
    earring_h = max(10, min(earring_h, 500))
    return earring_w, earring_h


def _paste_earring(
    canvas: Image.Image,
    earring: Image.Image,
    ear_x: float,
    ear_y: float,
    width: int,
    height: int,
    rotation_deg: float,
    anchor_x: float,
    anchor_y: float,
    mirror: bool = False,
) -> None:
    """Resize, rotate, and paste a single earring onto the canvas."""
    resized = earring.resize((width, height), Image.LANCZOS)

    if mirror:
        resized = resized.transpose(Image.FLIP_LEFT_RIGHT)

    # Rotate to match head tilt (expand=True keeps the full image)
    if abs(rotation_deg) > 0.5:
        resized = resized.rotate(-rotation_deg, resample=Image.BICUBIC, expand=True)

    # Calculate paste position so the anchor point aligns with the ear
    paste_x = int(ear_x - resized.width * anchor_x)
    paste_y = int(ear_y - resized.height * anchor_y)

    # Composite using alpha channel
    canvas.paste(resized, (paste_x, paste_y), resized)


def render_earrings(
    selfie: Image.Image,
    face: FaceLandmarks,
    asset: EarringAsset,
) -> bytes:
    """
    Composite earrings onto the selfie image at detected earlobe positions.

    Returns JPEG image bytes.
    """
    # Work on an RGBA copy so we can alpha-composite
    canvas = selfie.convert("RGBA")

    # Calculate earring size
    ew, eh = _scale_earring(
        asset.left_image, face,
        asset.real_world_width_mm, asset.real_world_height_mm,
    )

    roll = face.face_rotation.roll

    # Left earring
    _paste_earring(
        canvas, asset.left_image,
        ear_x=face.left_ear.x, ear_y=face.left_ear.y,
        width=ew, height=eh,
        rotation_deg=roll,
        anchor_x=asset.anchor_x, anchor_y=asset.anchor_y,
    )

    # Right earring (mirror if using same image)
    should_mirror = asset.right_image is asset.left_image
    _paste_earring(
        canvas, asset.right_image,
        ear_x=face.right_ear.x, ear_y=face.right_ear.y,
        width=ew, height=eh,
        rotation_deg=roll,
        anchor_x=asset.anchor_x, anchor_y=asset.anchor_y,
        mirror=should_mirror,
    )

    # Convert to RGB (JPEG doesn't support alpha) and export
    result = canvas.convert("RGB")
    buf = io.BytesIO()
    result.save(buf, format="JPEG", quality=90)
    return buf.getvalue()
