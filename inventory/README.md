# Inventory App

Django app for managing Etsy product inventory.

## Models

### Category
Product categories for organizing inventory items.

### Product
Main inventory model with:
- Basic info (SKU, title, description, category)
- Pricing (cost price, sale price with automatic profit margin calculation)
- Inventory tracking (available, reserved, low stock alerts)
- Etsy integration (listing ID, URL)
- Status management (active, draft, sold out, discontinued)

**Properties:**
- `profit_margin` - Calculated profit margin percentage
- `available_stock` - Available minus reserved quantity
- `is_low_stock` - Boolean check against threshold
- `total_value` - Total inventory value at cost

### StockMovement
Audit trail for all inventory changes:
- Purchase/Restock
- Sale
- Manual Adjustment
- Customer Return
- Damaged/Lost

### Supplier
Supplier contact and management information.

### ProductSupplier
Links products to suppliers with:
- Supplier-specific SKU
- Supplier pricing
- Minimum order quantities
- Lead times
- Primary supplier designation

## Admin Interface

Fully configured Django admin with:
- Inline editing for suppliers and stock movements
- Color-coded stock status indicators
- Profit margin visualization
- Search and filtering capabilities
- Read-only calculated fields

## Views & URLs

- `/inventory/` or `/inventory/products/` - Product list with search and filters
- `/inventory/products/<id>/` - Product detail with full information
- `/inventory/low-stock/` - Low stock alert report
- `/inventory/categories/` - Category listing

## Getting Started

1. Access Django admin at `/admin/`
2. Create categories for your products
3. Add suppliers (optional)
4. Create products with all necessary details
5. Track stock movements for audit trail
6. Monitor low stock alerts

## Management Commands

Standard Django commands work with this app:
```powershell
# Create migrations after model changes
python manage.py makemigrations inventory

# Run migrations
python manage.py migrate inventory

# Load fixtures (if you create any)
python manage.py loaddata inventory_fixtures
```
