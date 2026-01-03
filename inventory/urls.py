from django.urls import path
from . import views

app_name = 'inventory'

urlpatterns = [
    path('', views.product_list, name='product_list'),
    path('products/', views.product_list, name='product_list'),
    path('products/<int:pk>/', views.product_detail, name='product_detail'),
    path('low-stock/', views.low_stock_report, name='low_stock'),
    path('categories/', views.category_list, name='category_list'),
]
