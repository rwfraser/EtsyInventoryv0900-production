'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, AlertCircle } from 'lucide-react';

interface TryOnCameraProps {
  onImageCapture: (file: File) => void;
  onClose?: () => void;
}

export default function TryOnCamera({ onImageCapture, onClose }: TryOnCameraProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'upload'>('select');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode('camera');
    } catch (err) {
      setError('Could not access camera. Please check permissions.');
      console.error('Camera access error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      onImageCapture(file);
    }, 'image/jpeg', 0.9);
  }, [stopCamera, onImageCapture]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    onImageCapture(file);
  }, [onImageCapture]);

  // Rendered inline inside TryOnWidget — no wrapper modal needed
  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {mode === 'select' && (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm md:text-base">
            Take a selfie or upload a photo to see how these earrings look on you!
          </p>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {/* Camera Option */}
            <button
              onClick={startCamera}
              className="flex flex-col items-center justify-center p-6 md:p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 active:bg-purple-50 transition group min-h-[120px]"
            >
              <Camera className="w-10 h-10 md:w-12 md:h-12 text-gray-400 group-hover:text-purple-600 mb-2 md:mb-3" />
              <span className="font-medium text-gray-900 text-sm md:text-base">Take Photo</span>
              <span className="text-xs md:text-sm text-gray-500 mt-1">Use your camera</span>
            </button>

            {/* Upload Option */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 md:p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 active:bg-purple-50 transition group min-h-[120px]"
            >
              <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-400 group-hover:text-purple-600 mb-2 md:mb-3" />
              <span className="font-medium text-gray-900 text-sm md:text-base">Upload Photo</span>
              <span className="text-xs md:text-sm text-gray-500 mt-1">From your device</span>
            </button>
          </div>

          {/* Hidden file input — capture="user" opens front camera on mobile */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="p-3 md:p-4 bg-blue-50 rounded-lg">
            <p className="text-xs md:text-sm text-blue-800">
              <strong>Privacy:</strong> Your photo is processed locally and automatically deleted after 24 hours.
            </p>
          </div>
        </div>
      )}

      {mode === 'camera' && (
        <div className="space-y-4">
          {/* Portrait aspect on mobile, landscape on desktop */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-[3/4] md:aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              className="flex-1 min-h-[48px] bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 active:bg-purple-800 transition font-medium"
            >
              Capture Photo
            </button>
            <button
              onClick={() => {
                stopCamera();
                setMode('select');
              }}
              className="min-h-[48px] px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
