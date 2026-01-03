from django.shortcuts import render, get_object_or_404
from django.db.models import Sum, F, Q
from .models import Product, Category, StockMovement


def product_list(request):
    """Display list of all products"""
    products = Product.objects.select_related('category').all()
    
    # Filter by status if provided
    status = request.GET.get('status')
    if status:
        products = products.filter(status=status)
    
    # Filter by category if provided
    category_id = request.GET.get('category')
    if category_id:
        products = products.filter(category_id=category_id)
    
    # Search functionality
    search = request.GET.get('search')
    if search:
        products = products.filter(
            Q(sku__icontains=search) |
            Q(title__icontains=search) |
            Q(description__icontains=search)
        )
    
    context = {
        'products': products,
        'categories': Category.objects.all(),
        'status_choices': Product.STATUS_CHOICES,
    }
    return render(request, 'inventory/product_list.html', context)


def product_detail(request, pk):
    """Display detailed product information"""
    product = get_object_or_404(
        Product.objects.select_related('category')
        .prefetch_related('stock_movements', 'product_suppliers__supplier'),
        pk=pk
    )
    
    recent_movements = product.stock_movements.all()[:20]
    suppliers = product.product_suppliers.select_related('supplier').all()
    
    context = {
        'product': product,
        'recent_movements': recent_movements,
        'suppliers': suppliers,
    }
    return render(request, 'inventory/product_detail.html', context)


def low_stock_report(request):
    """Display products with low or out of stock"""
    products = Product.objects.select_related('category').filter(
        status='active'
    )
    
    # Filter for low stock items
    low_stock = [p for p in products if p.is_low_stock]
    
    # Calculate total inventory value
    total_value = sum(p.total_value for p in products)
    
    context = {
        'low_stock_products': low_stock,
        'total_value': total_value,
    }
    return render(request, 'inventory/low_stock_report.html', context)


def category_list(request):
    """Display all categories with product counts"""
    categories = Category.objects.prefetch_related('products').all()
    
    context = {
        'categories': categories,
    }
    return render(request, 'inventory/category_list.html', context)
