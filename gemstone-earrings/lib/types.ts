export interface Setting {
  product_number: string;
  product_title: string;
  price_per_setting: number;
  material: string;
  gemstone_dimensions: string;
  gemstone_shape: string;
  variant_id: number;
  product_url: string;
  quantity_needed: number;
}

export interface Gemstone {
  name: string;
  material: string | null;
  color: string | null;
  shape: string;
  size: string;
  price_per_stone: number;
  product_url: string;
  quantity_needed: number;
}

export interface Pricing {
  settings_subtotal: number;
  gemstones_subtotal: number;
  subtotal: number;
  markup: number;
  total_pair_price: number;
}

export interface Compatibility {
  size_match: string;
  shape_match: string;
}

export interface EarringPair {
  pair_id: string;
  setting: Setting;
  gemstone: Gemstone;
  pricing: Pricing;
  compatibility: Compatibility;
  vendor: string;
  category?: string;
  style?: string;
  description?: string;
  images?: string[];
}

export interface ProductData {
  generated_at: string;
  total_combinations: number;
  combinations: EarringPair[];
}

// Authentication types
export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: Date | null;
}

export interface CartItem {
  product: EarringPair;
  quantity: number;
}
