'use client';

import { useState, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { EarringPair } from '@/lib/types';
import { getUniqueColors, getUniqueShapes, getUniqueSizes, getUniqueMaterials, getUniqueVendors, filterProducts, sortProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import { ProductFilters } from '@/components/ProductFilters';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface ProductsListingProps {
  initialProducts: EarringPair[];
}

export default function ProductsListing({ initialProducts }: ProductsListingProps) {
  const [allProducts] = useState<EarringPair[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<EarringPair[]>(initialProducts);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Pending filters (not yet applied)
  const [pendingFilters, setPendingFilters] = useState({
    color: '',
    shape: '',
    size: '',
    material: '',
    vendor: '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
  });

  // Applied filters (currently active)
  const [appliedFilters, setAppliedFilters] = useState({
    color: '',
    shape: '',
    size: '',
    material: '',
    vendor: '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
  });

  const [sortBy, setSortBy] = useState<'newest-first' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('newest-first');

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
      vendor: '',
      minPrice: undefined,
      maxPrice: undefined,
    };
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const hasFilterChanges = JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);

  // Count how many filter fields are actively set
  const activeFilterCount = [appliedFilters.color, appliedFilters.shape, appliedFilters.size, appliedFilters.material, appliedFilters.vendor].filter(Boolean).length;

  const colors = getUniqueColors(allProducts);
  const shapes = getUniqueShapes(allProducts);
  const sizes = getUniqueSizes(allProducts);
  const materials = getUniqueMaterials(allProducts);
  const vendors = getUniqueVendors(allProducts);

  const filterProps = {
    pendingFilters,
    onFilterChange: setPendingFilters,
    onApply: handleApplyFilters,
    onClear: handleClearFilters,
    hasChanges: hasFilterChanges,
    colors,
    shapes,
    sizes,
    materials,
    vendors,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Desktop Filters Sidebar — hidden on mobile */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-6 sticky top-24">
          <h2 className="text-xl font-bold mb-4">Filters</h2>

          {/* Sort (desktop sidebar) */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="newest-first">Newest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>

          <ProductFilters {...filterProps} />
        </div>
      </aside>

      {/* Products Grid */}
      <main className="flex-1">
        {/* Mobile toolbar: filter button + sort + count */}
        <div className="flex flex-wrap items-center gap-3 mb-4 lg:hidden">
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <button className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-white border border-gray-300 rounded-lg font-medium text-sm shadow-sm">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[300px] sm:w-[360px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow down your search</SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <ProductFilters {...filterProps} onApply={() => { handleApplyFilters(); setFilterSheetOpen(false); }} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort dropdown (mobile) */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="min-h-[44px] px-3 bg-white border border-gray-300 rounded-lg text-sm shadow-sm"
          >
            <option value="newest-first">Newest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low → High)</option>
            <option value="price-desc">Price (High → Low)</option>
          </select>

          <span className="text-sm text-gray-600 ml-auto">
            {filteredProducts.length} of {allProducts.length}
          </span>
        </div>

        {/* Desktop product count */}
        <div className="hidden lg:block mb-4 text-gray-600">
          Showing {filteredProducts.length} of {allProducts.length} products
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No products match your filters.</p>
            <button
              onClick={handleClearFilters}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium min-h-[44px] py-2 px-6 rounded"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.pair_id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
