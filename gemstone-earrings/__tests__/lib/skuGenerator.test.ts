import { describe, it, expect } from 'vitest';
import { SKUGenerator } from '@/lib/skuGenerator';

describe('SKUGenerator', () => {
  describe('validateSKU', () => {
    it('accepts valid SKUs', () => {
      expect(SKUGenerator.validateSKU('Aa1a01')).toBe(true);
      expect(SKUGenerator.validateSKU('Bt4o05')).toBe(true);
      expect(SKUGenerator.validateSKU('Zz4o05')).toBe(false); // shelf z > t
      expect(SKUGenerator.validateSKU('Ab2c03')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(SKUGenerator.validateSKU('')).toBe(false);
      expect(SKUGenerator.validateSKU('short')).toBe(false);
      expect(SKUGenerator.validateSKU('toolongsku')).toBe(false);
      expect(SKUGenerator.validateSKU('invalid')).toBe(false);
    });

    it('rejects out-of-range components', () => {
      // Tray must be 1-4
      expect(SKUGenerator.validateSKU('Aa0a01')).toBe(false);
      expect(SKUGenerator.validateSKU('Aa5a01')).toBe(false);
      // Item must be 01-05
      expect(SKUGenerator.validateSKU('Aa1a00')).toBe(false);
      expect(SKUGenerator.validateSKU('Aa1a06')).toBe(false);
      // Shelf must be a-t
      expect(SKUGenerator.validateSKU('Au1a01')).toBe(false);
      // Bin must be a-o
      expect(SKUGenerator.validateSKU('Aa1p01')).toBe(false);
    });
  });

  describe('getStartingSKU', () => {
    it('returns Aa1a01', () => {
      expect(SKUGenerator.getStartingSKU()).toBe('Aa1a01');
    });
  });

  describe('nextSKU', () => {
    it('increments item number', () => {
      expect(SKUGenerator.nextSKU('Aa1a01')).toEqual({ success: true, sku: 'Aa1a02' });
      expect(SKUGenerator.nextSKU('Aa1a02')).toEqual({ success: true, sku: 'Aa1a03' });
      expect(SKUGenerator.nextSKU('Aa1a04')).toEqual({ success: true, sku: 'Aa1a05' });
    });

    it('overflows item to next bin', () => {
      expect(SKUGenerator.nextSKU('Aa1a05')).toEqual({ success: true, sku: 'Aa1b01' });
    });

    it('overflows bin to next tray', () => {
      expect(SKUGenerator.nextSKU('Aa1o05')).toEqual({ success: true, sku: 'Aa2a01' });
    });

    it('overflows tray to next shelf', () => {
      expect(SKUGenerator.nextSKU('Aa4o05')).toEqual({ success: true, sku: 'Ab1a01' });
    });

    it('overflows shelf to next rack', () => {
      expect(SKUGenerator.nextSKU('At4o05')).toEqual({ success: true, sku: 'Ba1a01' });
    });

    it('rejects invalid input SKU', () => {
      const result = SKUGenerator.nextSKU('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid SKU format');
    });

    it('returns error when storage is full', () => {
      const result = SKUGenerator.nextSKU('9t4o05');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage is full');
    });
  });

  describe('compareSKUs', () => {
    it('returns 0 for equal SKUs', () => {
      expect(SKUGenerator.compareSKUs('Aa1a01', 'Aa1a01')).toBe(0);
    });

    it('compares by item number', () => {
      expect(SKUGenerator.compareSKUs('Aa1a02', 'Aa1a01')).toBe(1);
      expect(SKUGenerator.compareSKUs('Aa1a01', 'Aa1a02')).toBe(-1);
    });

    it('compares by bin', () => {
      expect(SKUGenerator.compareSKUs('Aa1b01', 'Aa1a01')).toBe(1);
    });

    it('compares by tray', () => {
      expect(SKUGenerator.compareSKUs('Aa2a01', 'Aa1a01')).toBe(1);
    });

    it('compares by shelf', () => {
      expect(SKUGenerator.compareSKUs('Ab1a01', 'Aa1a01')).toBe(1);
    });

    it('compares by rack', () => {
      expect(SKUGenerator.compareSKUs('Ba1a01', 'Aa1a01')).toBe(1);
    });

    it('throws on invalid SKU', () => {
      expect(() => SKUGenerator.compareSKUs('invalid', 'Aa1a01')).toThrow();
    });
  });

  describe('findHighestSKU', () => {
    it('returns null for empty array', () => {
      expect(SKUGenerator.findHighestSKU([])).toBeNull();
    });

    it('returns null when all SKUs are invalid', () => {
      expect(SKUGenerator.findHighestSKU(['bad', 'invalid'])).toBeNull();
    });

    it('finds the highest SKU', () => {
      expect(SKUGenerator.findHighestSKU(['Aa1a01', 'Aa1a03', 'Aa1a02'])).toBe('Aa1a03');
      expect(SKUGenerator.findHighestSKU(['Ba1a01', 'Aa1a05', 'Ab2c03'])).toBe('Ba1a01');
    });

    it('ignores invalid SKUs in the array', () => {
      expect(SKUGenerator.findHighestSKU(['invalid', 'Aa1a02', 'bad'])).toBe('Aa1a02');
    });
  });
});
