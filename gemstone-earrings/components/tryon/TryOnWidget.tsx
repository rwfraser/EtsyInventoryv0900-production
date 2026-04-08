'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import TryOnCamera from './TryOnCamera';
import TryOnCanvas from './TryOnCanvas';

interface TryOnWidgetProps {
  product: {
    id: string;
    name: string;
    price?: string;
    image1?: string;
    leftEarringUrl?: string;
    rightEarringUrl?: string;
    realWorldWidth?: number;
    realWorldHeight?: number;
    anchorPointX?: number;
    anchorPointY?: number;
  };
  buttonClassName?: string;
  buttonText?: string;
  onClose?: () => void; // Optional callback for chatbot integration
  autoOpen?: boolean; // Auto-open modal (for chatbot)
}

export default function TryOnWidget({
  product,
  buttonClassName,
  buttonText = 'Try On Virtually',
  onClose,
  autoOpen = false,
}: TryOnWidgetProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleImageCapture = async (file: File) => {
    setSelfieFile(file);
    try {
      const formData = new FormData();
      formData.append('selfie', file);
      const response = await fetch('/api/tryon/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Selfie uploaded:', data.sessionId);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleComplete = (imageUrl: string) => {
    setResultUrl(imageUrl);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelfieFile(null);
    setResultUrl(null);
    onClose?.(); // Call parent onClose if provided (for chatbot)
  };

  const handleReset = () => {
    setSelfieFile(null);
    setResultUrl(null);
  };

  const tryOnProduct = {
    id: product.id,
    name: product.name,
    leftEarringUrl: product.leftEarringUrl || product.image1 || '/placeholder-earring.png',
    rightEarringUrl: product.rightEarringUrl,
    realWorldWidth: product.realWorldWidth || 15,
    realWorldHeight: product.realWorldHeight || 25,
    anchorPointX: product.anchorPointX || 0.5,
    anchorPointY: product.anchorPointY || 0.1,
  };

  return (
    <>
      {/* Trigger Button (hidden if autoOpen) */}
      {!autoOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={
            buttonClassName ||
            'flex items-center justify-center gap-2 w-full min-h-[48px] bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium shadow-lg hover:shadow-xl'
          }
        >
          <Sparkles className="w-5 h-5" />
          {buttonText}
        </button>
      )}

      {/* Modal — full-screen on mobile, centered card on desktop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:rounded-lg md:shadow-2xl md:max-w-4xl md:max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10 flex-shrink-0">
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-semibold truncate">Virtual Try-On</h2>
                <p className="text-sm text-gray-600 truncate">{product.name}</p>
              </div>
              <button
                onClick={handleClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 transition flex-shrink-0"
                aria-label="Close try-on"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              {!selfieFile && (
                <TryOnCamera
                  onImageCapture={handleImageCapture}
                  onClose={handleClose}
                />
              )}

              {selfieFile && !resultUrl && (
                <div>
                  <TryOnCanvas
                    selfieFile={selfieFile}
                    product={tryOnProduct}
                    onComplete={handleComplete}
                  />
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleReset}
                      className="min-h-[44px] text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      Use different photo
                    </button>
                  </div>
                </div>
              )}

              {resultUrl && (
                <div className="space-y-4">
                  <img
                    src={resultUrl}
                    alt="Try-on result"
                    className="w-full rounded-lg shadow-lg"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="flex-1 min-h-[48px] px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 min-h-[48px] px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
