"""
Face detection using MediaPipe Face Landmarker Task API.

Uses the modern Tasks API (v0.10.30+), NOT the legacy mp.solutions.face_mesh.
Provides 478 facial landmarks with precise earlobe positions.

Key landmarks:
  - 234: Left earlobe
  - 454: Right earlobe
  - 33:  Right eye outer corner
  - 263: Left eye outer corner
  - 1:   Nose tip (for yaw estimation)
  - 10:  Forehead center (for pitch estimation)
  - 152: Chin (for pitch estimation)

Requires the face_landmarker.task model bundle file.
Download from: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
"""

import logging
import math
import os
from dataclasses import dataclass
from pathlib import Path

import mediapipe as mp
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode


@dataclass
class EarPosition:
    x: float  # Pixel coordinate
    y: float  # Pixel coordinate
    z: float  # Depth (normalised, from MediaPipe)


@dataclass
class FaceRotation:
    pitch: float  # Up/down tilt in degrees
    yaw: float    # Left/right turn in degrees
    roll: float   # Head tilt in degrees


@dataclass
class FaceLandmarks:
    left_ear: EarPosition
    right_ear: EarPosition
    face_width_px: float        # Distance between eye outer corners in pixels
    face_rotation: FaceRotation


# ---------------------------------------------------------------------------
# Model path — resolved relative to this file
# ---------------------------------------------------------------------------
MODEL_PATH = os.environ.get(
    "FACE_LANDMARKER_MODEL_PATH",
    str(Path(__file__).parent / "face_landmarker.task"),
)


def _create_landmarker() -> FaceLandmarker:
    """Create a FaceLandmarker instance configured for single-image mode."""
    options = FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=VisionRunningMode.IMAGE,
        num_faces=1,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
    )
    return FaceLandmarker.create_from_options(options)


# Module-level singleton (lazy)
_landmarker: FaceLandmarker | None = None


def _get_landmarker() -> FaceLandmarker:
    global _landmarker
    if _landmarker is None:
        _landmarker = _create_landmarker()
    return _landmarker


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def detect_face(image: Image.Image) -> FaceLandmarks | None:
    """
    Detect facial landmarks in a PIL Image and return ear positions,
    face width, and head rotation.

    Returns None when no face is detected.
    """
    # Convert PIL Image to MediaPipe Image
    img_rgb = np.array(image.convert("RGB"))
    h, w, _ = img_rgb.shape
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

    # Run detection
    landmarker = _get_landmarker()
    result = landmarker.detect(mp_image)

    if not result.face_landmarks or len(result.face_landmarks) == 0:
        return None

    # result.face_landmarks[0] is a list of NormalizedLandmark with .x, .y, .z
    lm = result.face_landmarks[0]

    # --- Earlobe positions -------------------------------------------------
    # Landmarks 234/454 are the ear tragion (where ear meets head).
    # Landmarks 132/361 are on the jaw just below each ear.
    # The actual earlobe (where earrings hang) is between these two points,
    # weighted 60% tragion + 40% jaw to land at the lobe.
    def _earlobe(tragion_idx: int, jaw_idx: int) -> EarPosition:
        tx, ty = lm[tragion_idx].x * w, lm[tragion_idx].y * h
        jx, jy = lm[jaw_idx].x * w, lm[jaw_idx].y * h
        ex = tx * 0.6 + jx * 0.4
        ey = ty * 0.6 + jy * 0.4
        logger.info(
            "  Earlobe calc: tragion[%d]=(%.0f,%.0f) jaw[%d]=(%.0f,%.0f) => (%.0f,%.0f)",
            tragion_idx, tx, ty, jaw_idx, jx, jy, ex, ey,
        )
        return EarPosition(x=ex, y=ey, z=lm[tragion_idx].z)

    left_ear = _earlobe(234, 132)   # subject's left = viewer's right
    right_ear = _earlobe(454, 361)  # subject's right = viewer's left

    # --- Face width (pixel distance between eye outer corners) -------------
    right_eye_outer = (lm[33].x * w, lm[33].y * h)
    left_eye_outer = (lm[263].x * w, lm[263].y * h)
    face_width_px = math.dist(right_eye_outer, left_eye_outer)

    # --- Head rotation estimation ------------------------------------------
    # Roll: angle of line between eye outer corners
    dx = left_eye_outer[0] - right_eye_outer[0]
    dy = left_eye_outer[1] - right_eye_outer[1]
    roll = math.degrees(math.atan2(dy, dx))

    # Yaw: horizontal offset of nose tip from midpoint of eyes
    eye_mid_x = (right_eye_outer[0] + left_eye_outer[0]) / 2
    nose_x = lm[1].x * w
    yaw = ((nose_x - eye_mid_x) / max(face_width_px, 1)) * 60

    # Pitch: vertical offset of nose relative to forehead-chin line
    forehead_y = lm[10].y * h
    chin_y = lm[152].y * h
    nose_y = lm[1].y * h
    face_height = chin_y - forehead_y
    if face_height > 0:
        pitch = ((nose_y - (forehead_y + face_height * 0.45)) / face_height) * 40
    else:
        pitch = 0.0

    return FaceLandmarks(
        left_ear=left_ear,
        right_ear=right_ear,
        face_width_px=face_width_px,
        face_rotation=FaceRotation(pitch=pitch, yaw=yaw, roll=roll),
    )
