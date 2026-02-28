'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';

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

  /**
   * Start camera stream
   */
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

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  /**
   * Capture photo from camera
   */
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

  /**
   * Handle file upload
   */
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

  /**
   * Cleanup on unmount
   */
  const handleClose = useCallback(() => {
    stopCamera();
    if (onClose) onClose();
  }, [stopCamera, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Try On Earrings</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {mode === 'select' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Take a selfie or upload a photo to see how these earrings look on you!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Camera Option */}
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition group"
                >
                  <Camera className="w-12 h-12 text-gray-400 group-hover:text-purple-600 mb-3" />
                  <span className="font-medium text-gray-900">Take Photo</span>
                  <span className="text-sm text-gray-500 mt-1">Use your camera</span>
                </button>

                {/* Upload Option */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition group"
                >
                  <Upload className="w-12 h-12 text-gray-400 group-hover:text-purple-600 mb-3" />
                  <span className="font-medium text-gray-900">Upload Photo</span>
                  <span className="text-sm text-gray-500 mt-1">From your device</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Privacy:</strong> Your photo is processed locally and automatically deleted after 24 hours.
                </p>
              </div>
            </div>
          )}

          {mode === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
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
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Capture Photo
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    setMode('select');
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
