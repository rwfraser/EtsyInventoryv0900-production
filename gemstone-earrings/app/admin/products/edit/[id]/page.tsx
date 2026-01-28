'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '',
    stock: '',
  });

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`);
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
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
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
