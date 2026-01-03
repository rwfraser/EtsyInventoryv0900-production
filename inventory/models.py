from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Category(models.Model):
    """Product categories for organizing inventory"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """Main product/inventory item model"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('draft', 'Draft'),
        ('sold_out', 'Sold Out'),
        ('discontinued', 'Discontinued'),
    ]

    # Basic Info
    sku = models.CharField(max_length=50, unique=True, help_text="Stock Keeping Unit")
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    # Pricing
    cost_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Your cost to produce/acquire"
    )
    sale_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Selling price on Etsy"
    )
    
    # Inventory
    quantity_available = models.IntegerField(
        default=0, 
        validators=[MinValueValidator(0)],
        help_text="Current stock quantity"
    )
    quantity_reserved = models.IntegerField(
        default=0, 
        validators=[MinValueValidator(0)],
        help_text="Quantity reserved for pending orders"
    )
    low_stock_threshold = models.IntegerField(
        default=5,
        validators=[MinValueValidator(0)],
        help_text="Alert when stock falls below this number"
    )
    
    # Etsy Integration
    etsy_listing_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    etsy_url = models.URLField(blank=True, null=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, help_text="Internal notes")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['status']),
            models.Index(fields=['etsy_listing_id']),
        ]

    def __str__(self):
        return f"{self.sku} - {self.title}"

    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        if self.sale_price and self.cost_price and self.sale_price > 0:
            return ((self.sale_price - self.cost_price) / self.sale_price) * 100
        return 0

    @property
    def available_stock(self):
        """Calculate actual available stock (total - reserved)"""
        return max(0, self.quantity_available - self.quantity_reserved)

    @property
    def is_low_stock(self):
        """Check if stock is below threshold"""
        return self.available_stock <= self.low_stock_threshold

    @property
    def total_value(self):
        """Calculate total inventory value at cost price"""
        if self.cost_price and self.quantity_available is not None:
            return self.cost_price * self.quantity_available
        return 0


class StockMovement(models.Model):
    """Track all stock movements for audit trail"""
    MOVEMENT_TYPES = [
        ('purchase', 'Purchase/Restock'),
        ('sale', 'Sale'),
        ('adjustment', 'Manual Adjustment'),
        ('return', 'Customer Return'),
        ('damage', 'Damaged/Lost'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField(help_text="Positive for increase, negative for decrease")
    reference_number = models.CharField(max_length=100, blank=True, help_text="Order number, invoice, etc.")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', '-created_at']),
        ]

    def __str__(self):
        return f"{self.product.sku} - {self.movement_type}: {self.quantity} ({self.created_at.strftime('%Y-%m-%d')})"


class Supplier(models.Model):
    """Supplier information for products"""
    name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ProductSupplier(models.Model):
    """Link products to suppliers with supplier-specific details"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_suppliers')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='supplied_products')
    supplier_sku = models.CharField(max_length=50, blank=True, help_text="Supplier's product code")
    supplier_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Price from this supplier"
    )
    minimum_order_quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    lead_time_days = models.IntegerField(
        default=7,
        validators=[MinValueValidator(0)],
        help_text="Days from order to delivery"
    )
    is_primary = models.BooleanField(default=False, help_text="Primary supplier for this product")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['product', 'supplier']
        ordering = ['-is_primary', 'supplier__name']

    def __str__(self):
        return f"{self.product.sku} from {self.supplier.name}"
