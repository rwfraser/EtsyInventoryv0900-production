"""
Generate ERD diagram from Django models
"""
import os
import django
from graphviz import Digraph

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Etsyv0900.settings')
django.setup()

from EnhancedInventory.models import Component, Product, ProductComponent, MarketSnapshot
from inventory.models import Category, Product as InventoryProduct, StockMovement, Supplier, ProductSupplier

def create_erd():
    """Create an ERD diagram for both apps"""
    
    # Create two separate diagrams for clarity
    dot_enhanced = Digraph(comment='Enhanced Inventory ERD', format='png')
    dot_enhanced.attr(rankdir='LR', splines='ortho')
    dot_enhanced.attr('node', shape='record', fontname='Arial', fontsize='10')
    
    dot_inventory = Digraph(comment='Inventory ERD', format='png')
    dot_inventory.attr(rankdir='LR', splines='ortho')
    dot_inventory.attr('node', shape='record', fontname='Arial', fontsize='10')
    
    # Enhanced Inventory App
    dot_enhanced.node('Component', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD BGCOLOR="lightblue" COLSPAN="2"><B>Component</B></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">name</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">component_type</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">specs (JSON)</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">supplier_url (unique)</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">cost_per_unit</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">stock_level</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">reorder_point</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">is_discontinued</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">last_scraped_at</TD></TR>
        </TABLE>>''')
    
    dot_enhanced.node('Product', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD BGCOLOR="lightblue" COLSPAN="2"><B>Product</B></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">sku (unique)</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">title</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">description</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">base_cost</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">price</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">margin_percent</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">etsy_listing_id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">inventory</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">status</TD></TR>
        </TABLE>>''')
    
    dot_enhanced.node('ProductComponent', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD BGCOLOR="lightgreen" COLSPAN="2"><B>ProductComponent</B></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">id</TD></TR>
            <TR><TD ALIGN="LEFT">FK</TD><TD ALIGN="LEFT">product_id</TD></TR>
            <TR><TD ALIGN="LEFT">FK</TD><TD ALIGN="LEFT">component_id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">quantity</TD></TR>
        </TABLE>>''')
    
    dot_enhanced.node('MarketSnapshot', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD BGCOLOR="lightyellow" COLSPAN="2"><B>MarketSnapshot</B></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">id</TD></TR>
            <TR><TD ALIGN="LEFT">FK</TD><TD ALIGN="LEFT">product_id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">recorded_at</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">views</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">favorites</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">sales_count</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">listed_price</TD></TR>
        </TABLE>>''')
    
    # Relationships for Enhanced Inventory
    dot_enhanced.edge('ProductComponent', 'Product', label='many:1')
    dot_enhanced.edge('ProductComponent', 'Component', label='many:1')
    dot_enhanced.edge('MarketSnapshot', 'Product', label='many:1')
    
    # Inventory App
    dot_inventory.node('Category', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD BGCOLOR="lightblue" COLSPAN="2"><B>Category</B></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">name (unique)</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">description</TD></TR>
        </TABLE>>''')
    
    dot_inventory.node('InventoryProduct', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD BGCOLOR="lightblue" COLSPAN="2"><B>Product</B></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">sku (unique)</TD></TR>
            <TR><TD ALIGN="LEFT">FK</TD><TD ALIGN="LEFT">category_id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">title</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">cost_price</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">sale_price</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">quantity_available</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">quantity_reserved</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">etsy_listing_id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">status</TD></TR>
        </TABLE>>''')
    
    dot_inventory.node('StockMovement', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD BGCOLOR="lightyellow" COLSPAN="2"><B>StockMovement</B></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">id</TD></TR>
            <TR><TD ALIGN="LEFT">FK</TD><TD ALIGN="LEFT">product_id</TD></TR>
            <TR><TD ALIGN="LEFT">FK</TD><TD ALIGN="LEFT">created_by (User)</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">movement_type</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">quantity</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">reference_number</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">created_at</TD></TR>
        </TABLE>>''')
    
    dot_inventory.node('Supplier', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD BGCOLOR="lightblue" COLSPAN="2"><B>Supplier</B></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">name</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">contact_name</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">email</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">website</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">is_active</TD></TR>
        </TABLE>>''')
    
    dot_inventory.node('ProductSupplier', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD BGCOLOR="lightgreen" COLSPAN="2"><B>ProductSupplier</B></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">id</TD></TR>
            <TR><TD ALIGN="LEFT">FK</TD><TD ALIGN="LEFT">product_id</TD></TR>
            <TR><TD ALIGN="LEFT">FK</TD><TD ALIGN="LEFT">supplier_id</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">supplier_sku</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">supplier_price</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">minimum_order_qty</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">lead_time_days</TD></TR>
            <TR><TD ALIGN="LEFT"></TD><TD ALIGN="LEFT">is_primary</TD></TR>
        </TABLE>>''')
    
    # Relationships for Inventory
    dot_inventory.edge('InventoryProduct', 'Category', label='many:1')
    dot_inventory.edge('StockMovement', 'InventoryProduct', label='many:1')
    dot_inventory.edge('ProductSupplier', 'InventoryProduct', label='many:1')
    dot_inventory.edge('ProductSupplier', 'Supplier', label='many:1')
    
    # Render diagrams
    dot_enhanced.render('database_erd_enhanced_inventory', cleanup=True)
    dot_inventory.render('database_erd_inventory', cleanup=True)
    
    print("ERD diagrams generated successfully!")
    print("- database_erd_enhanced_inventory.png")
    print("- database_erd_inventory.png")

if __name__ == '__main__':
    create_erd()
