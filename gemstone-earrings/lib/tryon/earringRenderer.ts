import {
  FaceLandmarks,
  landmarkToPixels,
  calculateEarringScale,
  calculateEarringRotation,
} from './faceDetection';

export interface EarringAsset {
  leftEarringUrl: string;
  rightEarringUrl: string;
  realWorldWidth: number; // in mm
  realWorldHeight: number; // in mm
  anchorPointX: number; // 0-1, where on the earring image to attach
  anchorPointY: number; // 0-1
}

/**
 * Render earrings onto a selfie image
 */
export async function renderEarringsOnImage(
  selfieImage: HTMLImageElement,
  faceLandmarks: FaceLandmarks,
  earringAsset: EarringAsset
): Promise<string> {
  // Create canvas for compositing
  const canvas = document.createElement('canvas');
  canvas.width = selfieImage.width;
  canvas.height = selfieImage.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw the original selfie
  ctx.drawImage(selfieImage, 0, 0);

  // Load earring images
  const [leftEarring, rightEarring] = await Promise.all([
    loadImage(earringAsset.leftEarringUrl),
    loadImage(earringAsset.rightEarringUrl || earringAsset.leftEarringUrl), // Use left if right not provided
  ]);

  // Calculate positioning
  const leftEarPixels = landmarkToPixels(
    faceLandmarks.leftEar,
    selfieImage.width,
    selfieImage.height
  );
  
  const rightEarPixels = landmarkToPixels(
    faceLandmarks.rightEar,
    selfieImage.width,
    selfieImage.height
  );

  // Calculate scale based on face size
  const scale = calculateEarringScale(faceLandmarks, {
    width: earringAsset.realWorldWidth,
    height: earringAsset.realWorldHeight,
  });

  // Calculate rotation to match head tilt
  const rotation = calculateEarringRotation(faceLandmarks);

  // Calculate earring dimensions in pixels
  const earringWidthPx = (earringAsset.realWorldWidth / 140) * faceLandmarks.faceWidth * selfieImage.width;
  const earringHeightPx = (earringAsset.realWorldHeight / 140) * faceLandmarks.faceWidth * selfieImage.width;

  // Render left earring
  drawEarring(ctx, leftEarring, {
    x: leftEarPixels.x,
    y: leftEarPixels.y,
    width: earringWidthPx,
    height: earringHeightPx,
    rotation,
    anchorX: earringAsset.anchorPointX,
    anchorY: earringAsset.anchorPointY,
  });

  // Render right earring (mirror if using same image)
  const shouldMirror = !earringAsset.rightEarringUrl;
  drawEarring(ctx, rightEarring, {
    x: rightEarPixels.x,
    y: rightEarPixels.y,
    width: earringWidthPx,
    height: earringHeightPx,
    rotation,
    anchorX: earringAsset.anchorPointX,
    anchorY: earringAsset.anchorPointY,
    mirror: shouldMirror,
  });

  // Return as data URL
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Draw an earring on canvas with transformations
 */
function drawEarring(
  ctx: CanvasRenderingContext2D,
  earringImage: HTMLImageElement,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    anchorX: number;
    anchorY: number;
    mirror?: boolean;
  }
) {
  ctx.save();

  // Translate to ear position
  ctx.translate(options.x, options.y);

  // Rotate to match head tilt
  ctx.rotate((options.rotation * Math.PI) / 180);

  // Mirror if needed (for right ear when using left earring image)
  if (options.mirror) {
    ctx.scale(-1, 1);
  }

  // Calculate anchor offset (where the earring attaches to the ear)
  const anchorOffsetX = -options.width * options.anchorX;
  const anchorOffsetY = -options.height * options.anchorY;

  // Draw the earring image
  ctx.drawImage(
    earringImage,
    anchorOffsetX,
    anchorOffsetY,
    options.width,
    options.height
  );

  ctx.restore();
}

/**
 * Load an image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Allow CORS
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Convert data URL to Blob for uploading
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Resize image if it's too large (to optimize performance)
 */
export function resizeImageIfNeeded(
  image: HTMLImageElement,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  let { width, height } = image;

  // Calculate new dimensions while maintaining aspect ratio
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = width * ratio;
    height = height * ratio;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(image, 0, 0, width, height);
  }

  return canvas;
}
