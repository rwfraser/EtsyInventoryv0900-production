'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Download, Share2 } from 'lucide-react';
import {
  createFaceDetector,
  detectFaceLandmarks,
  FaceLandmarks,
} from '@/lib/tryon/faceDetection';
import {
  renderEarringsOnImage,
  EarringAsset,
  dataUrlToBlob,
  resizeImageIfNeeded,
} from '@/lib/tryon/earringRenderer';

interface TryOnCanvasProps {
  selfieFile: File;
  product: {
    id: string;
    name: string;
    leftEarringUrl?: string;
    rightEarringUrl?: string;
    realWorldWidth?: number;
    realWorldHeight?: number;
    anchorPointX?: number;
    anchorPointY?: number;
  };
  onComplete?: (resultImageUrl: string) => void;
}

export default function TryOnCanvas({ selfieFile, product, onComplete }: TryOnCanvasProps) {
  const [status, setStatus] = useState<'loading' | 'detecting' | 'rendering' | 'complete' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarks | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    processTryOn();
  }, [selfieFile, product]);

  async function processTryOn() {
    try {
      setStatus('loading');
      setError(null);

      // Load selfie image
      const selfieUrl = URL.createObjectURL(selfieFile);
      const selfieImg = new Image();
      await new Promise((resolve, reject) => {
        selfieImg.onload = resolve;
        selfieImg.onerror = reject;
        selfieImg.src = selfieUrl;
      });

      // Resize if needed for performance
      const resizedCanvas = resizeImageIfNeeded(selfieImg, 1024, 1024);
      const processedImg = new Image();
      await new Promise((resolve) => {
        processedImg.onload = resolve;
        processedImg.src = resizedCanvas.toDataURL();
      });

      // Detect face landmarks
      setStatus('detecting');
      const faceDetector = createFaceDetector();
      const landmarks = await detectFaceLandmarks(processedImg, faceDetector);

      if (!landmarks) {
        setError('No face detected in the photo. Please try another image with a clear view of your face.');
        setStatus('error');
        return;
      }

      setFaceLandmarks(landmarks);

      // Prepare earring asset
      const earringAsset: EarringAsset = {
        leftEarringUrl: product.leftEarringUrl || '/placeholder-earring.png',
        rightEarringUrl: product.rightEarringUrl || product.leftEarringUrl || '/placeholder-earring.png',
        realWorldWidth: product.realWorldWidth || 20, // Default 20mm
        realWorldHeight: product.realWorldHeight || 30, // Default 30mm
        anchorPointX: product.anchorPointX || 0.5, // Center
        anchorPointY: product.anchorPointY || 0.1, // Top
      };

      // Render earrings
      setStatus('rendering');
      const resultDataUrl = await renderEarringsOnImage(processedImg, landmarks, earringAsset);
      setResultImageUrl(resultDataUrl);
      setStatus('complete');

      if (onComplete) {
        onComplete(resultDataUrl);
      }

      URL.revokeObjectURL(selfieUrl);
    } catch (err) {
      console.error('Try-on processing error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while processing your photo');
      setStatus('error');
    }
  }

  function downloadImage() {
    if (!resultImageUrl) return;

    const link = document.createElement('a');
    link.download = `tryon-${product.name}-${Date.now()}.jpg`;
    link.href = resultImageUrl;
    link.click();
  }

  async function shareImage() {
    if (!resultImageUrl) return;

    const blob = dataUrlToBlob(resultImageUrl);
    const file = new File([blob], `tryon-${product.name}.jpg`, { type: 'image/jpeg' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Try On: ${product.name}`,
          text: 'Check out how these earrings look on me!',
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard or download
      downloadImage();
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Status Messages */}
      {status === 'loading' && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your photo...</p>
          </div>
        </div>
      )}

      {status === 'detecting' && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Detecting face landmarks...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        </div>
      )}

      {status === 'rendering' && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Rendering earrings...</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium mb-2">Error Processing Photo</p>
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={processTryOn}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {status === 'complete' && resultImageUrl && (
        <div className="space-y-4">
          {/* Result Image */}
          <div className="relative rounded-lg overflow-hidden shadow-lg">
            <img
              src={resultImageUrl}
              alt="Try-on result"
              className="w-full h-auto"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={downloadImage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={shareImage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>

          {/* Face Landmarks Debug Info (Optional) */}
          {process.env.NODE_ENV === 'development' && faceLandmarks && (
            <div className="p-4 bg-gray-100 rounded-lg text-xs font-mono">
              <details>
                <summary className="cursor-pointer font-semibold">Debug Info</summary>
                <pre className="mt-2 overflow-auto">
                  {JSON.stringify(faceLandmarks, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
