'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface PreviewData {
  sku: string;
  name: string;
  description: string;
  price: string;
  category: string;
  stock: number;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  aiDescription?: string;
  aiKeywords?: string[];
  aiProcessedAt?: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Earrings',
    stock: '1',
  });
  
  // Image files
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
  
  // Image previews (data URLs for display)
  const [imagePreviews, setImagePreviews] = useState<{
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
  
  // Preview data (after AI processing)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle image file selection
  const handleImageChange = (key: keyof typeof imageFiles, file: File | null) => {
    setImageFiles({ ...imageFiles, [key]: file });
    
    // Generate preview URL
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews({ ...imagePreviews, [key]: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviews({ ...imagePreviews, [key]: null });
    }
  };

  // Step 1: Generate Preview (upload images, call AI, generate SKU)
  const handleGeneratePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.price) {
        throw new Error('Name and price are required');
      }
      
      if (!imageFiles.image1) {
        throw new Error('At least one product image is required');
      }

      // Step 1: Upload images to Vercel Blob
      const uploadFormData = new FormData();
      if (imageFiles.image1) uploadFormData.append('image1', imageFiles.image1);
      if (imageFiles.image2) uploadFormData.append('image2', imageFiles.image2);
      if (imageFiles.image3) uploadFormData.append('image3', imageFiles.image3);
      if (imageFiles.image4) uploadFormData.append('image4', imageFiles.image4);
      
      const uploadResponse = await fetch('/api/admin/upload-images', {
        method: 'POST',
        body: uploadFormData,
      });
      
      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || 'Failed to upload images');
      }
      
      const { imageUrls } = await uploadResponse.json();

      // Step 2: Generate SKU
      const skuResponse = await fetch('/api/admin/sku/generate');
      if (!skuResponse.ok) {
        throw new Error('Failed to generate SKU');
      }
      const { sku } = await skuResponse.json();

      // Step 3: Process with AI (optional - can be added later)
      // For now, use user's description and generate basic keywords
      const aiDescription = formData.description || `Beautiful ${formData.name.toLowerCase()} perfect for any occasion.`;
      const aiKeywords = [
        formData.category.toLowerCase(),
        'jewelry',
        'handmade',
        ...formData.name.toLowerCase().split(' ').filter(w => w.length > 3)
      ];

      // Set preview data
      setPreviewData({
        sku,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        stock: parseInt(formData.stock) || 1,
        image1: imageUrls.image1 || undefined,
        image2: imageUrls.image2 || undefined,
        image3: imageUrls.image3 || undefined,
        image4: imageUrls.image4 || undefined,
        aiDescription,
        aiKeywords,
        aiProcessedAt: new Date().toISOString(),
      });

      // Move to preview step
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Products
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Fields - Moved to Top */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="image1" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image 1
                </label>
                <input
                  id="image1"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFiles({ ...imageFiles, image1: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {imageFiles.image1 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {imageFiles.image1.name}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="image2" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image 2
                </label>
                <input
                  id="image2"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFiles({ ...imageFiles, image2: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {imageFiles.image2 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {imageFiles.image2.name}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="image3" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image 3
                </label>
                <input
                  id="image3"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFiles({ ...imageFiles, image3: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {imageFiles.image3 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {imageFiles.image3.name}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="image4" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image 4
                </label>
                <input
                  id="image4"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFiles({ ...imageFiles, image4: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {imageFiles.image4 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {imageFiles.image4.name}
                  </div>
                )}
              </div>
            </div>

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

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Adding Product...' : 'Add Product'}
              </button>
              <Link
                href="/admin/products"
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
