from django.db import models
from django.utils.translation import gettext_lazy as _

class Component(models.Model):
    class Type(models.TextChoices):
        SETTING = 'SETTING', _('Setting')
        GEMSTONE = 'GEMSTONE', _('Gemstone')

    name = models.CharField(max_length=255)
    component_type = models.CharField(
        max_length=20,
        choices=Type.choices,
        db_index=True
    )
    
    # CRITICAL: Flexible Specs for Compatibility Check
    # Store things like: {"shape": "oval", "sizeMm": [6, 8], "settingType": "basket"}
    specs = models.JSONField(default=dict)
    
    supplier_url = models.URLField(unique=True)  # Unique ID for upserting
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    stock_level = models.IntegerField(default=0)
    reorder_point = models.IntegerField(default=10)
    
    # Meta for the Scraper Agents
    last_scraped_at = models.DateTimeField(auto_now=True)
    is_discontinued = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.component_type})"

class Product(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        ACTIVE = 'ACTIVE', _('Active')
        ARCHIVED = 'ARCHIVED', _('Archived')
    
    sku = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Financials
    base_cost = models.DecimalField(max_digits=10, decimal_places=2)  # Calculated from components
    price = models.DecimalField(max_digits=10, decimal_places=2)      # Current list price
    margin_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Helper for logic
    
    # External
    etsy_listing_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    etsy_url = models.URLField(null=True, blank=True)
    
    inventory = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    
    # Bill of Materials (Many-to-Many through explicit table)
    components = models.ManyToManyField(
        Component,
        through='ProductComponent',
        related_name='products'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.sku} - {self.title}"

class MarketSnapshot(models.Model):
    """The 'Brain' of the Growth Loop - Records performance over time so the AI can adjust pricing"""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='market_data'
    )
    
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    # Demand Signals
    views = models.IntegerField(default=0)
    favorites = models.IntegerField(default=0)
    sales_count = models.IntegerField(default=0)  # Sales since last snapshot
    
    # The price at this moment (to correlate price vs demand)
    listed_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        indexes = [
            models.Index(fields=['product', 'recorded_at']),
        ]
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.product.sku} snapshot at {self.recorded_at}"

class ProductComponent(models.Model):
    """Join table linking products to components with quantities"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    component = models.ForeignKey(Component, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    
    class Meta:
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['component']),
        ]
    
    def __str__(self):
        return f"{self.product.sku} uses {self.quantity}x {self.component.name}"
