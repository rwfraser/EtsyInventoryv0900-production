import { FaceMesh } from '@mediapipe/face_mesh';

export interface EarPosition {
  x: number;
  y: number;
  z?: number;
}

export interface FaceLandmarks {
  leftEar: EarPosition;
  rightEar: EarPosition;
  faceWidth: number; // Estimated face width in pixels for scaling
  faceRotation: {
    pitch: number; // Up/down tilt
    yaw: number;   // Left/right turn
    roll: number;  // Head tilt
  };
}

// MediaPipe landmark indices for ears (approximate)
const LEFT_EAR_TOP = 234;
const LEFT_EAR_BOTTOM = 127;
const RIGHT_EAR_TOP = 454;
const RIGHT_EAR_BOTTOM = 356;

// Face reference points for measurements
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const NOSE_TIP = 1;
const CHIN = 152;

/**
 * Initialize MediaPipe Face Mesh detector
 */
export function createFaceDetector(): FaceMesh {
  const faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    },
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return faceMesh;
}

/**
 * Detect face landmarks from an image
 */
export async function detectFaceLandmarks(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  faceMesh: FaceMesh
): Promise<FaceLandmarks | null> {
  return new Promise((resolve) => {
    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        resolve(null);
        return;
      }

      const landmarks = results.multiFaceLandmarks[0];
      
      // Calculate ear positions (average of top and bottom ear landmarks)
      const leftEar: EarPosition = {
        x: (landmarks[LEFT_EAR_TOP].x + landmarks[LEFT_EAR_BOTTOM].x) / 2,
        y: (landmarks[LEFT_EAR_TOP].y + landmarks[LEFT_EAR_BOTTOM].y) / 2,
        z: (landmarks[LEFT_EAR_TOP].z + landmarks[LEFT_EAR_BOTTOM].z) / 2,
      };

      const rightEar: EarPosition = {
        x: (landmarks[RIGHT_EAR_TOP].x + landmarks[RIGHT_EAR_BOTTOM].x) / 2,
        y: (landmarks[RIGHT_EAR_TOP].y + landmarks[RIGHT_EAR_BOTTOM].y) / 2,
        z: (landmarks[RIGHT_EAR_TOP].z + landmarks[RIGHT_EAR_BOTTOM].z) / 2,
      };

      // Calculate face width (distance between eyes)
      const leftEye = landmarks[LEFT_EYE_OUTER];
      const rightEye = landmarks[RIGHT_EYE_OUTER];
      const faceWidth = Math.sqrt(
        Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
      );

      // Estimate head rotation
      const noseTip = landmarks[NOSE_TIP];
      const chin = landmarks[CHIN];
      
      // Simple rotation estimation (can be improved with full 3D analysis)
      const pitch = (chin.y - noseTip.y) * 90; // Approximate pitch angle
      const yaw = (noseTip.x - 0.5) * 60; // Approximate yaw angle
      const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

      resolve({
        leftEar,
        rightEar,
        faceWidth,
        faceRotation: {
          pitch,
          yaw,
          roll,
        },
      });
    });

    // Send image to MediaPipe for processing
    faceMesh.send({ image: imageElement });
  });
}

/**
 * Calculate earring scale based on face size
 * @param faceLandmarks Detected face landmarks
 * @param earringRealWorldSize Size of earring in millimeters { width, height }
 * @returns Scale factor for rendering earring
 */
export function calculateEarringScale(
  faceLandmarks: FaceLandmarks,
  earringRealWorldSize: { width: number; height: number }
): number {
  // Average human face width is approximately 140mm
  const AVERAGE_FACE_WIDTH_MM = 140;
  
  // Convert face width in normalized coordinates to real-world mm
  const faceWidthMm = faceLandmarks.faceWidth * AVERAGE_FACE_WIDTH_MM;
  
  // Calculate scale based on earring real-world size
  // This ensures earrings appear at their actual size relative to the face
  const scale = faceWidthMm / AVERAGE_FACE_WIDTH_MM;
  
  return scale;
}

/**
 * Calculate rotation angle for earring based on head pose
 */
export function calculateEarringRotation(faceLandmarks: FaceLandmarks): number {
  // Use roll angle to rotate earrings to match head tilt
  return faceLandmarks.faceRotation.roll;
}

/**
 * Convert normalized landmark coordinates to pixel coordinates
 */
export function landmarkToPixels(
  landmark: EarPosition,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  return {
    x: landmark.x * imageWidth,
    y: landmark.y * imageHeight,
  };
}
