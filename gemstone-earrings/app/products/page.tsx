'use client';

import { useEffect, useState } from 'react';
import { EarringPair } from '@/lib/types';
import { getProducts, getUniqueColors, getUniqueShapes, getUniqueSizes, getUniqueMaterials, filterProducts, sortProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<EarringPair[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<EarringPair[]>([]);
  const [loading, setLoading] = useState(true);

  // Pending filters (not yet applied)
  const [pendingFilters, setPendingFilters] = useState({
    color: '',
    shape: '',
    size: '',
    material: '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
  });

  // Applied filters (currently active)
  const [appliedFilters, setAppliedFilters] = useState({
    color: '',
    shape: '',
    size: '',
    material: '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
  });

  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('name-asc');

  useEffect(() => {
    async function loadProducts() {
      const products = await getProducts();
      setAllProducts(products);
      setFilteredProducts(products);
      setLoading(false);
    }
    loadProducts();
  }, []);

  useEffect(() => {
    let result = filterProducts(allProducts, appliedFilters);
    result = sortProducts(result, sortBy);
    setFilteredProducts(result);
  }, [appliedFilters, sortBy, allProducts]);

  const handleApplyFilters = () => {
    setAppliedFilters(pendingFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      color: '',
      shape: '',
      size: '',
      material: '',
      minPrice: undefined,
      maxPrice: undefined,
    };
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const hasFilterChanges = JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-2xl">Loading products...</div>
      </div>
    );
  }

  const colors = getUniqueColors(allProducts);
  const shapes = getUniqueShapes(allProducts);
  const sizes = getUniqueSizes(allProducts);
  const materials = getUniqueMaterials(allProducts);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Browse All Earrings</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Filters</h2>

            {/* Sort */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>

            {/* Color Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Color</label>
              <select
                value={pendingFilters.color}
                onChange={(e) => setPendingFilters({ ...pendingFilters, color: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">All Colors</option>
                {colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            {/* Shape Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Shape</label>
              <select
                value={pendingFilters.shape}
                onChange={(e) => setPendingFilters({ ...pendingFilters, shape: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">All Shapes</option>
                {shapes.map(shape => (
                  <option key={shape} value={shape}>{shape}</option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Size</label>
              <select
                value={pendingFilters.size}
                onChange={(e) => setPendingFilters({ ...pendingFilters, size: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">All Sizes</option>
                {sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Material Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Material</label>
              <select
                value={pendingFilters.material}
                onChange={(e) => setPendingFilters({ ...pendingFilters, material: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">All Materials</option>
                {materials.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>

            {/* Apply and Clear Filters */}
            <div className="space-y-3">
              <button
                onClick={handleApplyFilters}
                disabled={!hasFilterChanges}
                className={`w-full font-bold py-2 px-4 rounded transition-colors ${
                  hasFilterChanges
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Apply Filters
              </button>
              
              <button
                onClick={handleClearFilters}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="flex-1">
          <div className="mb-4 text-gray-600">
            Showing {filteredProducts.length} of {allProducts.length} products
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600">No products match your filters.</p>
              <button
                onClick={handleClearFilters}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.pair_id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
