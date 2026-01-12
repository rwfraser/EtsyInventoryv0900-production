"""
Verify Etsy ID type and help locate the correct shop_id.
"""

import re

def analyze_id(id_string: str):
    """
    Analyze an Etsy ID to determine its type.
    """
    print(f"\nAnalyzing ID: {id_string}")
    print("=" * 80)
    
    # Shop IDs are typically numeric
    if id_string.isdigit():
        print("✓ This appears to be a SHOP ID (numeric)")
        print(f"  Shop ID: {id_string}")
        print(f"  You can use this for API calls!")
        return "shop_id"
    
    # User IDs are alphanumeric strings
    elif re.match(r'^[a-z0-9]+$', id_string.lower()):
        print("⚠ This appears to be a USER ID (alphanumeric string)")
        print(f"  User ID: {id_string}")
        print(f"  This is NOT the shop_id needed for API calls.")
        print(f"\n  User IDs are used in profile URLs like:")
        print(f"  https://www.etsy.com/people/{id_string}")
        return "user_id"
    
    else:
        print("✗ Unknown ID format")
        return "unknown"


def instructions_for_shop_id():
    """
    Print instructions for finding the numeric shop_id.
    """
    print("\n" + "=" * 80)
    print("HOW TO FIND YOUR NUMERIC SHOP ID")
    print("=" * 80)
    print("""
STEP 1: Go to Your Shop Manager
   → https://www.etsy.com/your/shops/me

STEP 2: Click on your shop name

STEP 3: Look at the URL in your browser
   It will show: https://www.etsy.com/your/shops/XXXXXXXX
   
   The XXXXXXXX is your numeric shop_id (e.g., 12345678)

ALTERNATIVE: Check Any Listing
   1. Go to one of your product listings
   2. Right-click and "View Page Source" (or Ctrl+U)
   3. Search for "shop_id" (Ctrl+F)
   4. Look for a line like: "shop_id":12345678
   5. That number is your shop_id

WHAT YOU NEED:
   - Shop ID: A numeric value (e.g., 12345678)
   - NOT the user ID (alphanumeric like 6e6l6mgza93mbqx2)
   - NOT the shop name (text like "MyShopName")
    """)


if __name__ == "__main__":
    print("ETSY ID VERIFICATION TOOL")
    print("=" * 80)
    
    # Check the provided ID
    test_id = "6e6l6mgza93mbqx2"
    
    id_type = analyze_id(test_id)
    
    if id_type == "user_id":
        instructions_for_shop_id()
        
        print("\n" + "=" * 80)
        print("NEXT STEPS")
        print("=" * 80)
        print("""
1. Follow the instructions above to find your numeric shop_id
2. Once you have it, save it in a .env file:
   
   ETSY_SHOP_ID=12345678
   
3. When your API key is approved, add it too:
   
   ETSY_API_KEY=your_keystring_here
   ETSY_SHOP_ID=12345678
        """)
    
    elif id_type == "shop_id":
        print("\n✓ Great! You can use this shop_id for Etsy API integration.")
        print(f"\nAdd this to your .env file:")
        print(f"  ETSY_SHOP_ID={test_id}")
