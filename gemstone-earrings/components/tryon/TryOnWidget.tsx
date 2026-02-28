'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import TryOnCamera from './TryOnCamera';
import TryOnCanvas from './TryOnCanvas';

interface TryOnWidgetProps {
  product: {
    id: string;
    name: string;
    price: string;
    image1?: string;
    // Try-on specific fields (optional, will use defaults if not provided)
    leftEarringUrl?: string;
    rightEarringUrl?: string;
    realWorldWidth?: number;
    realWorldHeight?: number;
    anchorPointX?: number;
    anchorPointY?: number;
  };
  buttonClassName?: string;
  buttonText?: string;
}

export default function TryOnWidget({
  product,
  buttonClassName,
  buttonText = 'Try On Virtually',
}: TryOnWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleImageCapture = async (file: File) => {
    setSelfieFile(file);
    
    // Optional: Upload to server
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
      // Continue anyway - processing happens client-side
    }
  };

  const handleComplete = (imageUrl: string) => {
    setResultUrl(imageUrl);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelfieFile(null);
    setResultUrl(null);
  };

  const handleReset = () => {
    setSelfieFile(null);
    setResultUrl(null);
  };

  // Prepare product data for rendering
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
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={
          buttonClassName ||
          'flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium shadow-lg hover:shadow-xl'
        }
      >
        <Sparkles className="w-5 h-5" />
        {buttonText}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Virtual Try-On</h2>
                <p className="text-sm text-gray-600">{product.name}</p>
              </div>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
              >
                Close
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
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
                      className="text-sm text-gray-600 hover:text-gray-900 underline"
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
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
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
