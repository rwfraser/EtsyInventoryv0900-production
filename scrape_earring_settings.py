import requests
import json
import os
import re
import subprocess
from openai import OpenAI
from dotenv import load_dotenv

# Clear OPENAI_API_KEY environment variable using PowerShell
subprocess.run(["powershell", "-Command", "$env:OPENAI_API_KEY = $null"], shell=True)

# Load environment variables
load_dotenv()

# Initialize OpenAI client
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

if api_key:
    # Remove quotes if present
    api_key = api_key.strip('"').strip("'")
client = OpenAI(api_key=api_key)

def fetch_all_products(base_url):
    """Fetch all products from the collection, handling pagination"""
    all_products = []
    page = 1
    
    while True:
        if page == 1:
            url = f"{base_url}/products.json"
        else:
            url = f"{base_url}/products.json?page={page}"
        
        print(f"Fetching page {page}...")
        response = requests.get(url)
        
        if response.status_code != 200:
            print(f"Error fetching page {page}: {response.status_code}")
            break
        
        data = response.json()
        products = data.get('products', [])
        
        if not products:
            break
        
        all_products.extend(products)
        page += 1
    
    print(f"Total products fetched: {len(all_products)}")
    return all_products

def extract_gemstone_info(body_html, title):
    """Extract gemstone dimensions and shape from product description"""
    # Common patterns to extract dimensions
    dimension_patterns = [
        r'(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*mm',
        r'(\d+(?:\.\d+)?)\s*mm\s*x\s*(\d+(?:\.\d+)?)\s*mm',
        r'mounting size[:\s]+(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)',
        r'mounting size[:\s]+(\d+(?:\.\d+)?)\s*mm'
    ]
    
    dimensions = []
    text = body_html + " " + title
    
    for pattern in dimension_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            dimensions.extend(matches)
    
    return dimensions

def analyze_with_openai(product):
    """Use OpenAI to analyze and categorize the product"""
    title = product.get('title', '')
    body_html = product.get('body_html', '')
    tags = product.get('tags', [])
    
    # Extract text content from HTML
    text_content = re.sub(r'<[^>]+>', '', body_html)
    
    prompt = f"""Analyze this earring setting product and determine:
1. Does it accept a FACETED gemstone (cut stone with multiple flat surfaces)? Answer YES or NO.
2. What is the shape of the gemstone it accepts? (e.g., round, oval, pear, square, cushion, rectangular, triangular, etc.)
3. What are the gemstone dimensions mentioned? List all sizes mentioned.

Product Title: {title}
Product Description: {text_content}
Product Tags: {', '.join(tags)}

Respond in this exact JSON format:
{{
    "accepts_faceted": true/false,
    "gemstone_shape": "shape name",
    "gemstone_dimensions": ["dimension1", "dimension2", ...]
}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a jewelry expert analyzing earring settings. Be precise and extract all relevant information."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        result = response.choices[0].message.content
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return None
    except Exception as e:
        print(f"Error analyzing product with OpenAI: {e}")
        return None

def extract_product_data(products):
    """Extract and categorize product data"""
    categorized_products = []
    
    for idx, product in enumerate(products, 1):
        print(f"Processing product {idx}/{len(products)}: {product.get('title', 'Unknown')}")
        
        # Get OpenAI analysis
        analysis = analyze_with_openai(product)
        
        if not analysis or not analysis.get('accepts_faceted'):
            print(f"  - Skipped (does not accept faceted gemstones)")
            continue
        
        # Extract variants (different sizes/options)
        variants = product.get('variants', [])
        
        for variant in variants:
            # Get the variant's specific size
            variant_size = variant.get('option1', 'N/A')
            
            product_data = {
                'product_number': variant.get('sku', 'N/A'),
                'product_title': product.get('title', 'N/A'),
                'price': f"${variant.get('price', '0')}",
                'material': 'Sterling Silver' if 'sterling silver' in product.get('product_type', '').lower() else product.get('product_type', 'N/A'),
                'overall_dimensions': variant_size,
                'gemstone_dimensions': variant_size,  # Use the specific variant size
                'gemstone_shape': analysis.get('gemstone_shape', 'N/A'),
                'available_quantity': 'In Stock' if variant.get('available', False) else 'Out of Stock',
                'variant_id': variant.get('id'),
                'product_url': f"https://diyjewelry.us/products/{product.get('handle')}"
            }
            
            categorized_products.append(product_data)
        
        print(f"  - Added {len(variants)} variant(s)")
    
    return categorized_products

def main():
    base_url = "https://diyjewelry.us/collections/earrings-settings"
    
    print("Starting earring settings extraction...")
    print("=" * 60)
    
    # Fetch all products
    products = fetch_all_products(base_url)
    
    if not products:
        print("No products found!")
        return
    
    print("=" * 60)
    print("Analyzing and categorizing products...")
    print("=" * 60)
    
    # Extract and categorize
    categorized_data = extract_product_data(products)
    
    # Save to JSON file
    output_file = 'earring_settings_faceted.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(categorized_data, f, indent=2, ensure_ascii=False)
    
    print("=" * 60)
    print(f"Extraction complete!")
    print(f"Total faceted earring settings found: {len(categorized_data)}")
    print(f"Data saved to: {output_file}")
    print("=" * 60)

if __name__ == "__main__":
    main()
