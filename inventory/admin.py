from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, StockMovement, Supplier, ProductSupplier


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'product_count', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'


class ProductSupplierInline(admin.TabularInline):
    model = ProductSupplier
    extra = 1
    fields = ['supplier', 'supplier_sku', 'supplier_price', 'minimum_order_quantity', 'lead_time_days', 'is_primary']


class StockMovementInline(admin.TabularInline):
    model = StockMovement
    extra = 0
    fields = ['movement_type', 'quantity', 'reference_number', 'notes', 'created_at']
    readonly_fields = ['created_at']
    can_delete = False
    max_num = 10
    ordering = ['-created_at']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'sku', 'title', 'category', 'status', 'stock_status',
        'quantity_available', 'quantity_reserved', 'sale_price', 'profit_display'
    ]
    list_filter = ['status', 'category', 'created_at', 'updated_at']
    search_fields = ['sku', 'title', 'description', 'etsy_listing_id']
    readonly_fields = ['created_at', 'updated_at', 'profit_margin', 'available_stock', 'total_value']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('sku', 'title', 'description', 'category', 'status')
        }),
        ('Pricing', {
            'fields': ('cost_price', 'sale_price', 'profit_margin')
        }),
        ('Inventory', {
            'fields': (
                'quantity_available', 'quantity_reserved', 'available_stock',
                'low_stock_threshold', 'total_value'
            )
        }),
        ('Etsy Integration', {
            'fields': ('etsy_listing_id', 'etsy_url'),
            'classes': ('collapse',)
        }),
        ('Notes & Metadata', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ProductSupplierInline, StockMovementInline]

    def stock_status(self, obj):
        if obj.is_low_stock:
            return format_html(
                '<span style="color: red; font-weight: bold;">⚠ LOW</span>'
            )
        elif obj.available_stock == 0:
            return format_html(
                '<span style="color: orange; font-weight: bold;">OUT</span>'
            )
        return format_html(
            '<span style="color: green;">✓ OK</span>'
        )
    stock_status.short_description = 'Stock Status'

    def profit_display(self, obj):
        margin = obj.profit_margin
        color = 'green' if margin > 30 else 'orange' if margin > 10 else 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, margin
        )
    profit_display.short_description = 'Margin'


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'reference_number', 'created_at', 'created_by']
    list_filter = ['movement_type', 'created_at']
    search_fields = ['product__sku', 'product__title', 'reference_number', 'notes']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('product', 'movement_type', 'quantity', 'reference_number')
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_by', 'created_at')
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_name', 'email', 'phone', 'is_active', 'product_count']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'contact_name', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'is_active')
        }),
        ('Contact Details', {
            'fields': ('contact_name', 'email', 'phone', 'address', 'website')
        }),
        ('Notes & Metadata', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def product_count(self, obj):
        return obj.supplied_products.count()
    product_count.short_description = 'Products Supplied'


@admin.register(ProductSupplier)
class ProductSupplierAdmin(admin.ModelAdmin):
    list_display = ['product', 'supplier', 'supplier_price', 'minimum_order_quantity', 'lead_time_days', 'is_primary']
    list_filter = ['is_primary', 'supplier']
    search_fields = ['product__sku', 'product__title', 'supplier__name', 'supplier_sku']
    readonly_fields = ['created_at', 'updated_at']
