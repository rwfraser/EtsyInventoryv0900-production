# MyEarringAdvisor Public API Documentation

**Version:** 1.0.0  
**Base URL:** `https://www.myearringadvisor.com`  
**Last Updated:** March 2026

---

## Overview

The MyEarringAdvisor API provides read-only access to product catalog data. This API is publicly accessible and does not require authentication.

### Rate Limiting

Please be respectful of our servers. We recommend:
- Maximum 60 requests per minute
- Cache responses when possible

---

## Endpoints

### Get All Products

Retrieves the complete product catalog.

**Endpoint:** `GET /api/products`

**Authentication:** None required

**Request Example:**

```bash
curl -X GET "https://www.myearringadvisor.com/api/products" \
  -H "Accept: application/json"
```

**Response Format:**

```json
{
  "products": [
    {
      "pair_id": "DB_550e8400-e29b-41d4-a716-446655440000",
      "setting": {
        "product_number": "550e8400-e29b-41d4-a716-446655440000",
        "product_title": "Blue Sapphire Stud Earrings",
        "price_per_setting": 24.99,
        "material": "Sterling Silver",
        "gemstone_dimensions": "",
        "gemstone_shape": "",
        "variant_id": 0,
        "product_url": "",
        "quantity_needed": 2
      },
      "gemstone": {
        "name": "Blue Sapphire Stud Earrings",
        "material": "Earrings",
        "color": null,
        "shape": "",
        "size": "",
        "price_per_stone": 24.99,
        "product_url": "",
        "quantity_needed": 2
      },
      "pricing": {
        "settings_subtotal": 24.99,
        "gemstones_subtotal": 24.99,
        "subtotal": 49.98,
        "markup": 0,
        "total_pair_price": 49.98
      },
      "compatibility": {
        "size_match": "Custom",
        "shape_match": "Custom"
      },
      "vendor": "Custom Design",
      "category": "Earrings",
      "description": "Beautiful blue sapphire stud earrings...",
      "images": [
        "https://example.blob.vercel-storage.com/products/image1.jpg",
        "https://example.blob.vercel-storage.com/products/image2.jpg"
      ]
    }
  ]
}
```

---

## Response Schema

### Product Object

| Field | Type | Description |
|-------|------|-------------|
| `pair_id` | string | Unique identifier for the product (prefixed with "DB_") |
| `setting` | object | Setting details (see Setting Object) |
| `gemstone` | object | Gemstone details (see Gemstone Object) |
| `pricing` | object | Pricing breakdown (see Pricing Object) |
| `compatibility` | object | Compatibility information |
| `vendor` | string | Always "Custom Design" |
| `category` | string | Product category (e.g., "Earrings", "Necklaces") |
| `description` | string | Product description (may include AI-enhanced content) |
| `images` | array | Array of image URLs (up to 4 images) |

### Setting Object

| Field | Type | Description |
|-------|------|-------------|
| `product_number` | string | Internal product ID |
| `product_title` | string | Product display name |
| `price_per_setting` | number | Half of total price |
| `material` | string | Material type ("Sterling Silver") |
| `gemstone_dimensions` | string | Dimensions if available |
| `gemstone_shape` | string | Shape if specified |
| `variant_id` | number | Variant identifier |
| `product_url` | string | External URL if available |
| `quantity_needed` | number | Always 2 (for pair) |

### Gemstone Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Gemstone/product name |
| `material` | string \| null | Category or material type |
| `color` | string \| null | Color if specified |
| `shape` | string | Shape description |
| `size` | string | Size description |
| `price_per_stone` | number | Price per individual stone |
| `product_url` | string | External URL if available |
| `quantity_needed` | number | Always 2 (for pair) |

### Pricing Object

| Field | Type | Description |
|-------|------|-------------|
| `settings_subtotal` | number | Settings cost (half of total) |
| `gemstones_subtotal` | number | Gemstones cost (half of total) |
| `subtotal` | number | Total before markup |
| `markup` | number | Applied markup (typically 0) |
| `total_pair_price` | number | **Final price for the product** |

### Compatibility Object

| Field | Type | Description |
|-------|------|-------------|
| `size_match` | string | Size compatibility ("Custom") |
| `shape_match` | string | Shape compatibility ("Custom") |

---

## Error Responses

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch products",
  "products": []
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
async function getProducts(): Promise<Product[]> {
  const response = await fetch('https://www.myearringadvisor.com/api/products');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.products;
}

// Usage
const products = await getProducts();
console.log(`Found ${products.length} products`);
```

### Python

```python
import requests

def get_products():
    response = requests.get('https://www.myearringadvisor.com/api/products')
    response.raise_for_status()
    return response.json()['products']

# Usage
products = get_products()
print(f"Found {len(products)} products")

# Access product data
for product in products:
    print(f"{product['setting']['product_title']}: ${product['pricing']['total_pair_price']}")
```

### PHP

```php
<?php
function getProducts() {
    $url = 'https://www.myearringadvisor.com/api/products';
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    return $data['products'];
}

// Usage
$products = getProducts();
echo "Found " . count($products) . " products\n";

foreach ($products as $product) {
    echo $product['setting']['product_title'] . ": $" . $product['pricing']['total_pair_price'] . "\n";
}
?>
```

---

## Common Use Cases

### Display Products on External Website

```javascript
// Fetch and display products
async function displayProducts() {
  const response = await fetch('https://www.myearringadvisor.com/api/products');
  const { products } = await response.json();
  
  products.forEach(product => {
    console.log({
      name: product.setting.product_title,
      price: product.pricing.total_pair_price,
      category: product.category,
      image: product.images[0], // Primary image
      description: product.description
    });
  });
}
```

### Filter by Category

```javascript
const { products } = await response.json();

// Get only earrings
const earrings = products.filter(p => p.category === 'Earrings');

// Get only necklaces
const necklaces = products.filter(p => p.category === 'Necklaces');
```

### Sort by Price

```javascript
const { products } = await response.json();

// Sort low to high
const byPriceAsc = [...products].sort(
  (a, b) => a.pricing.total_pair_price - b.pricing.total_pair_price
);

// Sort high to low
const byPriceDesc = [...products].sort(
  (a, b) => b.pricing.total_pair_price - a.pricing.total_pair_price
);
```

---

## Data Freshness

- Products are returned in order of most recently created (newest first)
- Data is served directly from the database (no caching layer)
- New products appear immediately after creation

---

## Support

For API support or questions, contact: **support@myearringadvisor.com**

---

## Terms of Use

By using this API, you agree to:

1. Not abuse the API with excessive requests
2. Properly attribute MyEarringAdvisor when displaying products
3. Not modify or misrepresent product information
4. Cache responses appropriately to reduce server load

---

## Changelog

### v1.0.0 (March 2026)
- Initial public API release
- GET /api/products endpoint
