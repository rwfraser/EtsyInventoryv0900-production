'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{
    success: boolean;
    message: string;
    description?: string;
    keywords?: string[];
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '',
    stock: '',
  });
  const [existingImages, setExistingImages] = useState<{
    image1: string | null;
    image2: string | null;
    image3: string | null;
    image4: string | null;
  }>({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });
  const [enhancedImages, setEnhancedImages] = useState<{
    enhancedImage1: string | null;
    enhancedImage2: string | null;
    enhancedImage3: string | null;
    enhancedImage4: string | null;
  }>({
    enhancedImage1: null,
    enhancedImage2: null,
    enhancedImage3: null,
    enhancedImage4: null,
  });
  const [aiData, setAiData] = useState<{
    aiDescription: string | null;
    aiKeywords: string[] | null;
    aiProcessedAt: string | null;
    originalDescription: string | null;
  }>({
    aiDescription: null,
    aiKeywords: null,
    aiProcessedAt: null,
    originalDescription: null,
  });
  const [imageFiles, setImageFiles] = useState<{
    image1: File | null;
    image2: File | null;
    image3: File | null;
    image4: File | null;
  }>({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`/api/admin/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.product.name || '',
            description: data.product.description || '',
            price: data.product.price || '',
            imageUrl: data.product.imageUrl || '',
            category: data.product.category || '',
            stock: data.product.stock?.toString() || '0',
          });
          setExistingImages({
            image1: data.product.image1 || null,
            image2: data.product.image2 || null,
            image3: data.product.image3 || null,
            image4: data.product.image4 || null,
          });
          setEnhancedImages({
            enhancedImage1: data.product.enhancedImage1 || null,
            enhancedImage2: data.product.enhancedImage2 || null,
            enhancedImage3: data.product.enhancedImage3 || null,
            enhancedImage4: data.product.enhancedImage4 || null,
          });
          setAiData({
            aiDescription: data.product.aiDescription || null,
            aiKeywords: data.product.aiKeywords ? JSON.parse(data.product.aiKeywords) : null,
            aiProcessedAt: data.product.aiProcessedAt || null,
            originalDescription: data.product.originalDescription || null,
          });
        } else {
          alert('Failed to load product');
          router.push('/admin/products');
        }
      } catch (error) {
        alert('An error occurred while loading the product');
        router.push('/admin/products');
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('imageUrl', formData.imageUrl);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('stock', formData.stock);

      // Append new image files if selected
      if (imageFiles.image1) formDataToSend.append('image1', imageFiles.image1);
      if (imageFiles.image2) formDataToSend.append('image2', imageFiles.image2);
      if (imageFiles.image3) formDataToSend.append('image3', imageFiles.image3);
      if (imageFiles.image4) formDataToSend.append('image4', imageFiles.image4);

      // Tell backend to keep existing images if no new file uploaded
      formDataToSend.append('keepImage1', (!imageFiles.image1).toString());
      formDataToSend.append('keepImage2', (!imageFiles.image2).toString());
      formDataToSend.append('keepImage3', (!imageFiles.image3).toString());
      formDataToSend.append('keepImage4', (!imageFiles.image4).toString());

      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (response.ok) {
        alert('Product updated successfully');
        router.push('/admin/products');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update product');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnhanceWithAI = async () => {
    // Check if product has at least one image
    const hasImages = existingImages.image1 || existingImages.image2 || existingImages.image3 || existingImages.image4;
    if (!hasImages) {
      alert('Product must have at least one image to use AI enhancement');
      return;
    }

    if (!confirm('This will analyze the product images and generate an AI-enhanced description. Continue?')) {
      return;
    }

    setIsProcessingAI(true);
    setAiResult(null);

    try {
      const response = await fetch('/api/ai/process-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAiResult({
          success: true,
          message: 'AI processing completed successfully!',
          description: data.aiDescription,
          keywords: data.aiKeywords,
        });
        
        // Update AI data state immediately
        setAiData({
          aiDescription: data.aiDescription || null,
          aiKeywords: data.aiKeywords || null,
          aiProcessedAt: new Date().toISOString(),
          originalDescription: formData.description || null,
        });
        
        // Update enhanced images if available
        if (data.product) {
          setEnhancedImages({
            enhancedImage1: data.product.enhancedImage1 || null,
            enhancedImage2: data.product.enhancedImage2 || null,
            enhancedImage3: data.product.enhancedImage3 || null,
            enhancedImage4: data.product.enhancedImage4 || null,
          });
        }
        
        // Update the description field with AI-generated content
        if (data.aiDescription) {
          setFormData({ ...formData, description: data.aiDescription });
        }
      } else {
        setAiResult({
          success: false,
          message: data.error || 'Failed to process product with AI',
        });
      }
    } catch (error) {
      setAiResult({
        success: false,
        message: 'An error occurred during AI processing',
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Product deleted successfully');
        router.push('/admin/products');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-2xl">Loading product...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Products
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Ruby Earrings"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  id="stock"
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                id="category"
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Earrings, Necklaces"
              />
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Image Upload Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="image1" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image 1
                </label>
                {existingImages.image1 && !imageFiles.image1 && (
                  <div className="mb-2">
                    <img src={existingImages.image1} alt="Current Image 1" className="h-24 w-24 object-cover rounded" />
                    <p className="text-xs text-gray-500 mt-1">Current image</p>
                  </div>
                )}
                <input
                  id="image1"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFiles({ ...imageFiles, image1: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {imageFiles.image1 && (
                  <div className="mt-2 text-sm text-green-600">
                    New: {imageFiles.image1.name}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="image2" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image 2
                </label>
                {existingImages.image2 && !imageFiles.image2 && (
                  <div className="mb-2">
                    <img src={existingImages.image2} alt="Current Image 2" className="h-24 w-24 object-cover rounded" />
                    <p className="text-xs text-gray-500 mt-1">Current image</p>
                  </div>
                )}
                <input
                  id="image2"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFiles({ ...imageFiles, image2: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {imageFiles.image2 && (
                  <div className="mt-2 text-sm text-green-600">
                    New: {imageFiles.image2.name}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="image3" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image 3
                </label>
                {existingImages.image3 && !imageFiles.image3 && (
                  <div className="mb-2">
                    <img src={existingImages.image3} alt="Current Image 3" className="h-24 w-24 object-cover rounded" />
                    <p className="text-xs text-gray-500 mt-1">Current image</p>
                  </div>
                )}
                <input
                  id="image3"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFiles({ ...imageFiles, image3: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {imageFiles.image3 && (
                  <div className="mt-2 text-sm text-green-600">
                    New: {imageFiles.image3.name}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="image4" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image 4
                </label>
                {existingImages.image4 && !imageFiles.image4 && (
                  <div className="mb-2">
                    <img src={existingImages.image4} alt="Current Image 4" className="h-24 w-24 object-cover rounded" />
                    <p className="text-xs text-gray-500 mt-1">Current image</p>
                  </div>
                )}
                <input
                  id="image4"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFiles({ ...imageFiles, image4: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {imageFiles.image4 && (
                  <div className="mt-2 text-sm text-green-600">
                    New: {imageFiles.image4.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <Link
                href="/admin/products"
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* AI Enhancement Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">🤖 AI Enhancement</h3>
                <p className="text-sm text-gray-600">
                  Use AI to analyze product images and generate an optimized description
                </p>
              </div>
              <button
                type="button"
                onClick={handleEnhanceWithAI}
                disabled={isProcessingAI}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {isProcessingAI ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  '✨ Enhance with AI'
                )}
              </button>
            </div>

            {/* AI Status Display */}
            {aiData.aiDescription && (
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-purple-900">🤖 AI-Enhanced Content</h4>
                  {aiData.aiProcessedAt && (
                    <span className="text-xs text-purple-600">
                      Processed: {new Date(aiData.aiProcessedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                
                {aiData.originalDescription && (
                  <div className="mb-3 p-3 bg-white rounded border border-purple-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">Original Description:</p>
                    <p className="text-sm text-gray-700">{aiData.originalDescription}</p>
                  </div>
                )}
                
                <div className="mb-3 p-3 bg-white rounded border border-purple-100">
                  <p className="text-xs font-medium text-purple-900 mb-1">AI Description (Current):</p>
                  <p className="text-sm text-purple-800">{aiData.aiDescription}</p>
                </div>
                
                {aiData.aiKeywords && aiData.aiKeywords.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-purple-900 mb-2">Keywords:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiData.aiKeywords.map((keyword, i) => (
                        <span key={i} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* AI Result Display (temporary message) */}
            {aiResult && (
              <div className={`p-4 rounded-lg mb-4 ${
                aiResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-medium ${
                  aiResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {aiResult.success ? '✅ ' : '❌ '}{aiResult.message}
                </p>
              </div>
            )}
            
            {/* Enhanced Images Display */}
            {(enhancedImages.enhancedImage1 || enhancedImages.enhancedImage2 || enhancedImages.enhancedImage3 || enhancedImages.enhancedImage4) && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-3">✨ AI-Enhanced Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((num) => {
                    const enhancedKey = `enhancedImage${num}` as keyof typeof enhancedImages;
                    const originalKey = `image${num}` as keyof typeof existingImages;
                    const enhancedUrl = enhancedImages[enhancedKey];
                    const originalUrl = existingImages[originalKey];
                    
                    if (!enhancedUrl) return null;
                    
                    return (
                      <div key={num} className="bg-white p-3 rounded border border-indigo-200">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {originalUrl && (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Original:</p>
                              <img src={originalUrl} alt={`Original ${num}`} className="w-full h-24 object-cover rounded" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-indigo-700 font-medium mb-1">Enhanced:</p>
                            <img src={enhancedUrl} alt={`Enhanced ${num}`} className="w-full h-24 object-cover rounded" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={enhancedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                          >
                            View Full Size
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete enhanced image ${num}?`)) {
                                setEnhancedImages({ ...enhancedImages, [enhancedKey]: null });
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-indigo-600 mt-3">
                  🎪 Generated by Gemini using professional baseline reference photo
                </p>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> AI analyzes your product images using Gemini vision model,
                then generates an SEO-optimized description using GPT-5.2. The original description is preserved.
              </p>
            </div>
          </div>

          {/* Delete Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">
              Deleting a product is permanent and cannot be undone.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
