"""
Find your Etsy Shop ID using the Etsy API.
This requires an approved API key and OAuth access token.

Run this after your API application is approved.
"""

import requests
import json
import os
from dotenv import load_dotenv


def find_shop_by_name(api_key: str, shop_name: str):
    """
    Find shop ID by shop name using public API endpoint.
    This doesn't require OAuth - just an API key.
    """
    url = f"https://openapi.etsy.com/v3/application/shops"
    
    headers = {
        "x-api-key": api_key,
    }
    
    params = {
        "shop_name": shop_name
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('results'):
            shop = data['results'][0]
            shop_id = shop.get('shop_id')
            
            print(f"\n✓ Found your shop!")
            print(f"  Shop Name: {shop.get('shop_name')}")
            print(f"  Shop ID: {shop_id}")
            print(f"  URL: https://www.etsy.com/shop/{shop.get('shop_name')}")
            
            return shop_id
        else:
            print(f"\n✗ No shop found with name: {shop_name}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"\n✗ API Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None


def find_shop_by_user(api_key: str, oauth_token: str):
    """
    Find all shops owned by the authenticated user.
    This requires OAuth token (after user authorization).
    """
    url = "https://openapi.etsy.com/v3/application/users/me/shops"
    
    headers = {
        "x-api-key": api_key,
        "Authorization": f"Bearer {oauth_token}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        shops = data.get('results', [])
        
        print(f"\n✓ Found {len(shops)} shop(s) for your account:")
        print("=" * 80)
        
        for i, shop in enumerate(shops, 1):
            print(f"\n{i}. {shop.get('shop_name')}")
            print(f"   Shop ID: {shop.get('shop_id')}")
            print(f"   URL: https://www.etsy.com/shop/{shop.get('shop_name')}")
            print(f"   Active: {shop.get('is_active', 'Unknown')}")
        
        if shops:
            return shops[0].get('shop_id')  # Return first shop ID
        return None
            
    except requests.exceptions.RequestException as e:
        print(f"\n✗ API Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None


def manual_lookup_guide():
    """
    Print instructions for finding shop ID manually.
    """
    print("\n" + "=" * 80)
    print("MANUAL SHOP ID LOOKUP GUIDE")
    print("=" * 80)
    print("""
METHOD 1: From Shop Manager (Easiest)
1. Go to: https://www.etsy.com/your/shops/me
2. Click on your shop name
3. Look at the URL - it will show: /your/shops/SHOP_ID
   The number after /shops/ is your shop_id

METHOD 2: From Shop Page (Browser Console)
1. Go to your shop page: https://www.etsy.com/shop/YourShopName
2. Right-click and select "Inspect" (or press F12)
3. Go to the Console tab
4. Paste this and press Enter:
   document.querySelector('[data-shop-id]')?.getAttribute('data-shop-id')
5. It will display your shop ID

METHOD 3: From Any Shop Listing
1. Go to any of your product listings
2. Look at the URL: /listing/LISTING_ID
3. We can use the API to get shop_id from listing_id later

Save your shop_id for use in the Etsy integration!
    """)


if __name__ == "__main__":
    print("ETSY SHOP ID FINDER")
    print("=" * 80)
    
    # Try to load from .env file
    load_dotenv()
    api_key = os.getenv('ETSY_API_KEY')
    oauth_token = os.getenv('ETSY_OAUTH_TOKEN')
    shop_name = os.getenv('ETSY_SHOP_NAME')
    
    if not api_key:
        print("\n⚠ No API key found in environment variables.")
        print("\nTo use this script, create a .env file with:")
        print("  ETSY_API_KEY=your_api_keystring_here")
        print("  ETSY_SHOP_NAME=YourShopName  (optional)")
        print("  ETSY_OAUTH_TOKEN=your_oauth_token  (optional, for authenticated lookup)")
        manual_lookup_guide()
    else:
        print(f"✓ API key found: {api_key[:20]}...")
        
        if shop_name:
            print(f"✓ Shop name found: {shop_name}")
            print("\nAttempting to find shop by name...")
            shop_id = find_shop_by_name(api_key, shop_name)
            
            if shop_id:
                print(f"\n✓ Success! Your shop_id is: {shop_id}")
                print("\nAdd this to your .env file:")
                print(f"  ETSY_SHOP_ID={shop_id}")
        
        elif oauth_token:
            print("✓ OAuth token found")
            print("\nAttempting to find your shops...")
            shop_id = find_shop_by_user(api_key, oauth_token)
            
            if shop_id:
                print(f"\n✓ Success! Your primary shop_id is: {shop_id}")
                print("\nAdd this to your .env file:")
                print(f"  ETSY_SHOP_ID={shop_id}")
        else:
            print("\n⚠ No shop name or OAuth token provided.")
            manual_lookup_guide()
