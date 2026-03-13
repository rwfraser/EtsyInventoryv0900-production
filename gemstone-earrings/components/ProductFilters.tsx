'use client';

interface FilterValues {
  color: string;
  shape: string;
  size: string;
  material: string;
  vendor: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
}

interface ProductFiltersProps {
  pendingFilters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onApply: () => void;
  onClear: () => void;
  hasChanges: boolean;
  colors: string[];
  shapes: string[];
  sizes: string[];
  materials: string[];
  vendors: string[];
  /** When true, auto-apply on every change (used in mobile sheet). */
  autoApply?: boolean;
}

export function ProductFilters({
  pendingFilters,
  onFilterChange,
  onApply,
  onClear,
  hasChanges,
  colors,
  shapes,
  sizes,
  materials,
  vendors,
}: ProductFiltersProps) {
  const selectClass =
    'w-full min-h-[44px] p-2 border rounded text-base sm:text-sm';

  return (
    <div className="space-y-5">
      {/* Color */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Color</label>
        <select
          value={pendingFilters.color}
          onChange={(e) =>
            onFilterChange({ ...pendingFilters, color: e.target.value })
          }
          className={selectClass}
        >
          <option value="">All Colors</option>
          {colors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Shape */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Shape</label>
        <select
          value={pendingFilters.shape}
          onChange={(e) =>
            onFilterChange({ ...pendingFilters, shape: e.target.value })
          }
          className={selectClass}
        >
          <option value="">All Shapes</option>
          {shapes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Size */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Size</label>
        <select
          value={pendingFilters.size}
          onChange={(e) =>
            onFilterChange({ ...pendingFilters, size: e.target.value })
          }
          className={selectClass}
        >
          <option value="">All Sizes</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Material */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Material</label>
        <select
          value={pendingFilters.material}
          onChange={(e) =>
            onFilterChange({ ...pendingFilters, material: e.target.value })
          }
          className={selectClass}
        >
          <option value="">All Materials</option>
          {materials.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Vendor */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Vendor</label>
        <select
          value={pendingFilters.vendor}
          onChange={(e) =>
            onFilterChange({ ...pendingFilters, vendor: e.target.value })
          }
          className={selectClass}
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Apply / Clear */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onApply}
          disabled={!hasChanges}
          className={`w-full font-bold min-h-[44px] py-2 px-4 rounded transition-colors ${
            hasChanges
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Apply Filters
        </button>

        <button
          onClick={onClear}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium min-h-[44px] py-2 px-4 rounded"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
