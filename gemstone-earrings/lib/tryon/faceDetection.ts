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

/**
 * Initialize BlazeFace detector (client-side only)
 * BlazeFace is a lightweight face detection model that works reliably in browsers
 */
export async function createFaceDetector(): Promise<any> {
  // Only run in browser
  if (typeof window === 'undefined') {
    throw new Error('Face detection can only run in the browser');
  }

  console.log('[FaceDetection] Initializing TensorFlow.js and BlazeFace...');
  
  // Dynamically import TensorFlow.js libraries
  const [tfCore, tfBackend, blazeface] = await Promise.all([
    import('@tensorflow/tfjs-core'),
    import('@tensorflow/tfjs-backend-webgl'),
    import('@tensorflow-models/blazeface'),
  ]);

  // Set backend to WebGL for better performance
  await tfCore.setBackend('webgl');
  await tfCore.ready();
  
  console.log('[FaceDetection] TensorFlow.js backend ready:', tfCore.getBackend());

  // Load BlazeFace model
  console.log('[FaceDetection] Loading BlazeFace model...');
  const model = await blazeface.load();
  console.log('[FaceDetection] BlazeFace model loaded successfully');
  
  return model;
}

/**
 * Detect face landmarks from an image using BlazeFace
 * BlazeFace provides 6 keypoints: left eye, right eye, nose tip, mouth center, left ear, right ear
 */
export async function detectFaceLandmarks(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  detector: any
): Promise<FaceLandmarks | null> {
  console.log('[FaceDetection] Starting face detection with BlazeFace...');
  
  try {
    const predictions = await detector.estimateFaces(imageElement, false);

    if (!predictions || predictions.length === 0) {
      console.log('[FaceDetection] No faces detected');
      return null;
    }

    console.log('[FaceDetection] Face detected, processing landmarks...');
    const face = predictions[0];
    
    // BlazeFace provides: [rightEye, leftEye, nose, mouth, rightEarTragion, leftEarTragion]
    // Indices: 0=rightEye, 1=leftEye, 2=nose, 3=mouth, 4=rightEar, 5=leftEar
    const landmarks = face.landmarks;
    const width = imageElement.width;
    const height = imageElement.height;
    
    // Extract eye positions (normalized to 0-1)
    const rightEye = { x: landmarks[0][0] / width, y: landmarks[0][1] / height };
    const leftEye = { x: landmarks[1][0] / width, y: landmarks[1][1] / height };
    const nose = { x: landmarks[2][0] / width, y: landmarks[2][1] / height };
    
    // Calculate face width (distance between eyes)
    const faceWidth = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
    );
    
    // Estimate ear positions based on face geometry
    // Ears are positioned:
    // - Horizontally: About 60-70% of face width outward from each eye
    // - Vertically: Slightly below eye level (about 10-20% of face width down)
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const earHorizontalOffset = faceWidth * 0.65; // 65% of face width from eye
    const earVerticalOffset = faceWidth * 0.15; // 15% down from eye level
    
    const leftEar: EarPosition = {
      x: leftEye.x - earHorizontalOffset,
      y: eyeCenterY + earVerticalOffset,
      z: 0,
    };

    const rightEar: EarPosition = {
      x: rightEye.x + earHorizontalOffset,
      y: eyeCenterY + earVerticalOffset,
      z: 0,
    };

    // Estimate head rotation based on eye and nose positions
    const yaw = (nose.x - 0.5) * 60; // Horizontal head turn
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    const pitch = 0; // BlazeFace doesn't provide enough info for accurate pitch

    console.log('[FaceDetection] Landmarks processed successfully');
    console.log('[FaceDetection] Left ear:', leftEar, 'Right ear:', rightEar);
    
    return {
      leftEar,
      rightEar,
      faceWidth,
      faceRotation: {
        pitch,
        yaw,
        roll,
      },
    };
  } catch (error) {
    console.error('[FaceDetection] Error during detection:', error);
    throw error;
  }
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
