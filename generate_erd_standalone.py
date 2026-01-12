"""
Generate ERD diagram for Etsy Inventory project
Standalone version - no Django import needed
"""
from graphviz import Digraph

def create_enhanced_inventory_erd():
    """Create ERD for Enhanced Inventory App"""
    dot = Digraph(comment='Enhanced Inventory ERD', format='png')
    dot.attr(rankdir='TB', splines='ortho', nodesep='0.5', ranksep='1')
    dot.attr('node', shape='plaintext', fontname='Arial', fontsize='11')
    dot.attr('edge', fontsize='9', fontcolor='gray40')
    
    # Component table
    dot.node('Component', '''<
        <TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
            <TR><TD BGCOLOR="#4A90E2" COLSPAN="3"><FONT COLOR="white"><B>Component</B></FONT></TD></TR>
            <TR><TD BGCOLOR="#E8F4FD">PK</TD><TD ALIGN="LEFT" BGCOLOR="#E8F4FD">id</TD><TD BGCOLOR="#E8F4FD">integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">name</TD><TD>varchar(255)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">component_type</TD><TD>varchar(20)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">specs</TD><TD>JSON</TD></TR>
            <TR><TD BGCOLOR="#FFF9E6">UK</TD><TD ALIGN="LEFT" BGCOLOR="#FFF9E6">supplier_url</TD><TD BGCOLOR="#FFF9E6">URL</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">cost_per_unit</TD><TD>decimal(10,2)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">stock_level</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">reorder_point</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">is_discontinued</TD><TD>boolean</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">last_scraped_at</TD><TD>datetime</TD></TR>
        </TABLE>>''')
    
    # Product table
    dot.node('Product', '''<
        <TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
            <TR><TD BGCOLOR="#4A90E2" COLSPAN="3"><FONT COLOR="white"><B>Product</B></FONT></TD></TR>
            <TR><TD BGCOLOR="#E8F4FD">PK</TD><TD ALIGN="LEFT" BGCOLOR="#E8F4FD">id</TD><TD BGCOLOR="#E8F4FD">integer</TD></TR>
            <TR><TD BGCOLOR="#FFF9E6">UK</TD><TD ALIGN="LEFT" BGCOLOR="#FFF9E6">sku</TD><TD BGCOLOR="#FFF9E6">varchar(50)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">title</TD><TD>varchar(255)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">description</TD><TD>text</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">base_cost</TD><TD>decimal(10,2)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">price</TD><TD>decimal(10,2)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">margin_percent</TD><TD>decimal(5,2)</TD></TR>
            <TR><TD BGCOLOR="#FFF9E6">UK</TD><TD ALIGN="LEFT" BGCOLOR="#FFF9E6">etsy_listing_id</TD><TD BGCOLOR="#FFF9E6">varchar(100)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">inventory</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">status</TD><TD>varchar(20)</TD></TR>
        </TABLE>>''')
    
    # ProductComponent join table
    dot.node('ProductComponent', '''<
        <TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
            <TR><TD BGCOLOR="#7CB342" COLSPAN="3"><FONT COLOR="white"><B>ProductComponent</B></FONT></TD></TR>
            <TR><TD BGCOLOR="#E8F4FD">PK</TD><TD ALIGN="LEFT" BGCOLOR="#E8F4FD">id</TD><TD BGCOLOR="#E8F4FD">integer</TD></TR>
            <TR><TD BGCOLOR="#FFE8E8">FK</TD><TD ALIGN="LEFT" BGCOLOR="#FFE8E8">product_id</TD><TD BGCOLOR="#FFE8E8">integer</TD></TR>
            <TR><TD BGCOLOR="#FFE8E8">FK</TD><TD ALIGN="LEFT" BGCOLOR="#FFE8E8">component_id</TD><TD BGCOLOR="#FFE8E8">integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">quantity</TD><TD>integer</TD></TR>
        </TABLE>>''')
    
    # MarketSnapshot table
    dot.node('MarketSnapshot', '''<
        <TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
            <TR><TD BGCOLOR="#FFA726" COLSPAN="3"><FONT COLOR="white"><B>MarketSnapshot</B></FONT></TD></TR>
            <TR><TD BGCOLOR="#E8F4FD">PK</TD><TD ALIGN="LEFT" BGCOLOR="#E8F4FD">id</TD><TD BGCOLOR="#E8F4FD">integer</TD></TR>
            <TR><TD BGCOLOR="#FFE8E8">FK</TD><TD ALIGN="LEFT" BGCOLOR="#FFE8E8">product_id</TD><TD BGCOLOR="#FFE8E8">integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">recorded_at</TD><TD>datetime</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">views</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">favorites</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">sales_count</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">listed_price</TD><TD>decimal(10,2)</TD></TR>
        </TABLE>>''')
    
    # Relationships
    dot.edge('ProductComponent', 'Product', label='  many:1', arrowhead='crow')
    dot.edge('ProductComponent', 'Component', label='  many:1', arrowhead='crow')
    dot.edge('MarketSnapshot', 'Product', label='  many:1', arrowhead='crow')
    
    return dot

def create_inventory_erd():
    """Create ERD for Inventory App"""
    dot = Digraph(comment='Inventory App ERD', format='png')
    dot.attr(rankdir='TB', splines='ortho', nodesep='0.5', ranksep='1')
    dot.attr('node', shape='plaintext', fontname='Arial', fontsize='11')
    dot.attr('edge', fontsize='9', fontcolor='gray40')
    
    # Category table
    dot.node('Category', '''<
        <TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
            <TR><TD BGCOLOR="#4A90E2" COLSPAN="3"><FONT COLOR="white"><B>Category</B></FONT></TD></TR>
            <TR><TD BGCOLOR="#E8F4FD">PK</TD><TD ALIGN="LEFT" BGCOLOR="#E8F4FD">id</TD><TD BGCOLOR="#E8F4FD">integer</TD></TR>
            <TR><TD BGCOLOR="#FFF9E6">UK</TD><TD ALIGN="LEFT" BGCOLOR="#FFF9E6">name</TD><TD BGCOLOR="#FFF9E6">varchar(100)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">description</TD><TD>text</TD></TR>
        </TABLE>>''')
    
    # Product table
    dot.node('InventoryProduct', '''<
        <TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
            <TR><TD BGCOLOR="#4A90E2" COLSPAN="3"><FONT COLOR="white"><B>Product</B></FONT></TD></TR>
            <TR><TD BGCOLOR="#E8F4FD">PK</TD><TD ALIGN="LEFT" BGCOLOR="#E8F4FD">id</TD><TD BGCOLOR="#E8F4FD">integer</TD></TR>
            <TR><TD BGCOLOR="#FFF9E6">UK</TD><TD ALIGN="LEFT" BGCOLOR="#FFF9E6">sku</TD><TD BGCOLOR="#FFF9E6">varchar(50)</TD></TR>
            <TR><TD BGCOLOR="#FFE8E8">FK</TD><TD ALIGN="LEFT" BGCOLOR="#FFE8E8">category_id</TD><TD BGCOLOR="#FFE8E8">integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">title</TD><TD>varchar(200)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">cost_price</TD><TD>decimal(10,2)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">sale_price</TD><TD>decimal(10,2)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">quantity_available</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">quantity_reserved</TD><TD>integer</TD></TR>
            <TR><TD BGCOLOR="#FFF9E6">UK</TD><TD ALIGN="LEFT" BGCOLOR="#FFF9E6">etsy_listing_id</TD><TD BGCOLOR="#FFF9E6">varchar(50)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">status</TD><TD>varchar(20)</TD></TR>
        </TABLE>>''')
    
    # StockMovement table
    dot.node('StockMovement', '''<
        <TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
            <TR><TD BGCOLOR="#FFA726" COLSPAN="3"><FONT COLOR="white"><B>StockMovement</B></FONT></TD></TR>
            <TR><TD BGCOLOR="#E8F4FD">PK</TD><TD ALIGN="LEFT" BGCOLOR="#E8F4FD">id</TD><TD BGCOLOR="#E8F4FD">integer</TD></TR>
            <TR><TD BGCOLOR="#FFE8E8">FK</TD><TD ALIGN="LEFT" BGCOLOR="#FFE8E8">product_id</TD><TD BGCOLOR="#FFE8E8">integer</TD></TR>
            <TR><TD BGCOLOR="#FFE8E8">FK</TD><TD ALIGN="LEFT" BGCOLOR="#FFE8E8">created_by</TD><TD BGCOLOR="#FFE8E8">integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">movement_type</TD><TD>varchar(20)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">quantity</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">reference_number</TD><TD>varchar(100)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">created_at</TD><TD>datetime</TD></TR>
        </TABLE>>''')
    
    # Supplier table
    dot.node('Supplier', '''<
        <TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
            <TR><TD BGCOLOR="#4A90E2" COLSPAN="3"><FONT COLOR="white"><B>Supplier</B></FONT></TD></TR>
            <TR><TD BGCOLOR="#E8F4FD">PK</TD><TD ALIGN="LEFT" BGCOLOR="#E8F4FD">id</TD><TD BGCOLOR="#E8F4FD">integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">name</TD><TD>varchar(200)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">contact_name</TD><TD>varchar(100)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">email</TD><TD>varchar</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">website</TD><TD>URL</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">is_active</TD><TD>boolean</TD></TR>
        </TABLE>>''')
    
    # ProductSupplier join table
    dot.node('ProductSupplier', '''<
        <TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6">
            <TR><TD BGCOLOR="#7CB342" COLSPAN="3"><FONT COLOR="white"><B>ProductSupplier</B></FONT></TD></TR>
            <TR><TD BGCOLOR="#E8F4FD">PK</TD><TD ALIGN="LEFT" BGCOLOR="#E8F4FD">id</TD><TD BGCOLOR="#E8F4FD">integer</TD></TR>
            <TR><TD BGCOLOR="#FFE8E8">FK</TD><TD ALIGN="LEFT" BGCOLOR="#FFE8E8">product_id</TD><TD BGCOLOR="#FFE8E8">integer</TD></TR>
            <TR><TD BGCOLOR="#FFE8E8">FK</TD><TD ALIGN="LEFT" BGCOLOR="#FFE8E8">supplier_id</TD><TD BGCOLOR="#FFE8E8">integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">supplier_sku</TD><TD>varchar(50)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">supplier_price</TD><TD>decimal(10,2)</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">minimum_order_qty</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">lead_time_days</TD><TD>integer</TD></TR>
            <TR><TD></TD><TD ALIGN="LEFT">is_primary</TD><TD>boolean</TD></TR>
        </TABLE>>''')
    
    # Relationships
    dot.edge('InventoryProduct', 'Category', label='  many:1', arrowhead='crow')
    dot.edge('StockMovement', 'InventoryProduct', label='  many:1', arrowhead='crow')
    dot.edge('ProductSupplier', 'InventoryProduct', label='  many:1', arrowhead='crow')
    dot.edge('ProductSupplier', 'Supplier', label='  many:1', arrowhead='crow')
    
    return dot

if __name__ == '__main__':
    print("Generating ERD diagrams...")
    
    # Generate Enhanced Inventory ERD
    dot_enhanced = create_enhanced_inventory_erd()
    dot_enhanced.render('database_erd_enhanced_inventory', cleanup=True)
    print("✓ Generated: database_erd_enhanced_inventory.png")
    
    # Generate Inventory ERD
    dot_inventory = create_inventory_erd()
    dot_inventory.render('database_erd_inventory', cleanup=True)
    print("✓ Generated: database_erd_inventory.png")
    
    print("\nERD diagrams created successfully!")
