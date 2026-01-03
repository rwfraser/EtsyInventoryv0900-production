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
    
    # flexible_specs replaces the rigid columns
    # Ex: {"shape": "OVAL", "dimensions": [8, 6], "material": "14k Gold"}
    specs = models.JSONField(default=dict)
    
    supplier_url = models.URLField(unique=True) # Unique ID for upserting
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    stock_level = models.IntegerField(default=0)
    
    last_scraped_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.component_type})"

class Product(models.Model):
    sku = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Financials
    base_cost = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Bill of Materials (Many-to-Many through explicit table)
    components = models.ManyToManyField(
        Component, 
        through='ProductComponent',
        related_name='products'
    )
    
    etsy_listing_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ProductComponent(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    component = models.ForeignKey(Component, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)