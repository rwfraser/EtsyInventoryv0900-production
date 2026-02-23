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

  // Step 2: Create Product (save to database)
  const handleCreateProduct = async () => {
    if (!previewData) return;
    
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/products/create-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const { product } = await response.json();
      
      // Success - redirect to products list
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setIsCreating(false);
    }
  };

  // Edit preview data
  const handleEditPreview = (field: keyof PreviewData, value: any) => {
    if (!previewData) return;
    setPreviewData({ ...previewData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 'form' ? 'Add New Product' : 'Review & Create Product'}
          </h1>
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Products
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {step === 'form' ? (
          /* STEP 1: Form Input */
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleGeneratePreview} className="space-y-6">
              {/* Image Upload Fields */}
              <div className="grid grid-cols-2 gap-4">
                {(['image1', 'image2', 'image3', 'image4'] as const).map((key, index) => (
                  <div key={key}>
                    <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                      Product Image {index + 1} {index === 0 && '*'}
                    </label>
                    <input
                      id={key}
                      type="file"
                      accept="image/*"
                      required={index === 0}
                      onChange={(e) => handleImageChange(key, e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {imagePreviews[key] && (
                      <div className="mt-2 relative w-full h-32">
                        <Image
                          src={imagePreviews[key]!}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
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
                  placeholder="e.g., Ruby Gemstone Earrings"
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
                  placeholder="Brief description (AI will enhance this)..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                    Stock *
                  </label>
                  <input
                    id="stock"
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Earrings">Earrings</option>
                    <option value="Necklaces">Necklaces</option>
                    <option value="Bracelets">Bracelets</option>
                    <option value="Rings">Rings</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {isGenerating ? 'Generating Preview...' : '→ Generate Preview & SKU'}
                </button>
                <Link
                  href="/admin/products"
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 2: Preview & Create */
          <div className="space-y-6">
            {/* Product Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Product Preview</h2>
                <div className="text-sm text-gray-500">
                  SKU: <span className="font-mono font-bold text-purple-600">{previewData?.sku}</span>
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {(['image1', 'image2', 'image3', 'image4'] as const).map((key) => (
                  previewData?.[key] && (
                    <div key={key} className="relative w-full h-40">
                      <Image
                        src={previewData[key]!}
                        alt={`Product ${key}`}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )
                ))}
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={previewData?.name || ''}
                    onChange={(e) => handleEditPreview('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI-Enhanced Description
                  </label>
                  <textarea
                    rows={4}
                    value={previewData?.aiDescription || ''}
                    onChange={(e) => handleEditPreview('aiDescription', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">You can edit the AI-generated description</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {previewData?.aiKeywords?.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={previewData?.price || ''}
                      onChange={(e) => handleEditPreview('price', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={previewData?.stock || 1}
                      onChange={(e) => handleEditPreview('stock', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={previewData?.category || ''}
                      onChange={(e) => handleEditPreview('category', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleCreateProduct}
                disabled={isCreating}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
              >
                {isCreating ? 'Creating Product...' : '✓ Create Product'}
              </button>
              <button
                onClick={() => setStep('form')}
                disabled={isCreating}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100 font-medium"
              >
                ← Back to Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
