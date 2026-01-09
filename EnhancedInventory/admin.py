from django.contrib import admin
from .models import Component, Product, ProductComponent, MarketSnapshot

@admin.register(Component)
class ComponentAdmin(admin.ModelAdmin):
    list_display = ('name', 'component_type', 'cost_per_unit', 'stock_level', 'reorder_point', 'is_discontinued')
    list_filter = ('component_type', 'is_discontinued')
    search_fields = ('name', 'supplier_url')
    readonly_fields = ('last_scraped_at', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'component_type', 'specs')
        }),
        ('Pricing & Inventory', {
            'fields': ('supplier_url', 'cost_per_unit', 'stock_level', 'reorder_point')
        }),
        ('Meta', {
            'fields': ('is_discontinued', 'last_scraped_at', 'created_at', 'updated_at')
        }),
    )

class ProductComponentInline(admin.TabularInline):
    model = ProductComponent
    extra = 1
    autocomplete_fields = ['component']

class MarketSnapshotInline(admin.TabularInline):
    model = MarketSnapshot
    extra = 0
    readonly_fields = ('recorded_at', 'views', 'favorites', 'sales_count', 'listed_price')
    can_delete = False
    max_num = 5  # Show last 5 snapshots
    
    def has_add_permission(self, request, obj=None):
        return False  # MarketSnapshots should be created programmatically

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('sku', 'title', 'status', 'price', 'margin_percent', 'inventory', 'etsy_listing_id')
    list_filter = ('status',)
    search_fields = ('sku', 'title', 'etsy_listing_id')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ProductComponentInline, MarketSnapshotInline]
    fieldsets = (
        ('Basic Info', {
            'fields': ('sku', 'title', 'description', 'status')
        }),
        ('Financials', {
            'fields': ('base_cost', 'price', 'margin_percent', 'inventory')
        }),
        ('Etsy Integration', {
            'fields': ('etsy_listing_id', 'etsy_url')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(MarketSnapshot)
class MarketSnapshotAdmin(admin.ModelAdmin):
    list_display = ('product', 'recorded_at', 'views', 'favorites', 'sales_count', 'listed_price')
    list_filter = ('recorded_at',)
    search_fields = ('product__sku', 'product__title')
    readonly_fields = ('recorded_at',)
    date_hierarchy = 'recorded_at'
    
    def has_add_permission(self, request):
        # Snapshots should typically be created via automated scripts
        return True
    
    fieldsets = (
        ('Product', {
            'fields': ('product',)
        }),
        ('Demand Signals', {
            'fields': ('views', 'favorites', 'sales_count')
        }),
        ('Pricing', {
            'fields': ('listed_price',)
        }),
        ('Timestamp', {
            'fields': ('recorded_at',)
        }),
    )
