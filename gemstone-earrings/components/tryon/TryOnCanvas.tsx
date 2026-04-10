'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download, Share2 } from 'lucide-react';

interface TryOnCanvasProps {
  selfieFile: File;
  product: {
    id: string;
    name: string;
    image1?: string;
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
  const [status, setStatus] = useState<'processing' | 'complete' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  useEffect(() => {
    processTryOn();
  }, [selfieFile, product]);

  async function processTryOn() {
    try {
      setStatus('processing');
      setError(null);

      // Determine earring image URL
      const earringUrl = product.leftEarringUrl || product.image1 || '';
      if (!earringUrl) {
        throw new Error('This product does not have any images available for virtual try-on.');
      }

      // Build multipart form for the server-side try-on service
      const formData = new FormData();
      formData.append('selfie', selfieFile);
      formData.append('earring_url', earringUrl);
      formData.append('right_earring_url', product.rightEarringUrl || '');
      formData.append('real_world_width', String(product.realWorldWidth || 20));
      formData.append('real_world_height', String(product.realWorldHeight || 30));
      formData.append('anchor_x', String(product.anchorPointX || 0.5));
      formData.append('anchor_y', String(product.anchorPointY || 0.1));

      const response = await fetch('/api/tryon/render', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Try-on failed' }));
        throw new Error(errData.error || errData.detail || 'Try-on rendering failed');
      }

      // Convert the returned JPEG bytes to an object URL for display
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setResultImageUrl(objectUrl);
      setStatus('complete');

      if (onComplete) {
        onComplete(objectUrl);
      }
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
    const resp = await fetch(resultImageUrl);
    const blob = await resp.blob();
    const file = new File([blob], `tryon-${product.name}.jpg`, { type: 'image/jpeg' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Try On: ${product.name}`,
          text: 'Check out how these earrings look on me!',
        });
      } catch {
        // Share cancelled
      }
    } else {
      downloadImage();
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {status === 'processing' && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Processing your try-on...</p>
            <p className="text-sm text-gray-500 mt-2">Detecting face and rendering earrings</p>
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
          <div className="relative rounded-lg overflow-hidden shadow-lg">
            <img
              src={resultImageUrl}
              alt="Try-on result"
              className="w-full h-auto"
            />
          </div>

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
        </div>
      )}
    </div>
  );
}
