# Product Image Generation Script

This script automates the creation of product images for the gemstone earrings e-commerce website by:
1. Scraping gemstone images from ottofrei.com
2. Scraping setting images from diyjewelry.us
3. Using Google's Gemini API (Nano Banana Pro) to generate photorealistic composite images
4. Saving images to the website's public directory

## Prerequisites

### 1. Google Gemini API Key
You need a Google Gemini API key with access to the `gemini-3-pro-image-preview` model (Nano Banana Pro).

**Get your API key:**
- Visit https://ai.google.dev/
- Sign in with your Google account
- Go to "Get API Key" in Google AI Studio
- Create a new API key or use an existing one

### 2. Python Environment
Make sure you're in the virtual environment:
```powershell
cd C:\Users\RogerIdaho\Etsy\Etsyv0900
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```powershell
pip install -r requirements_image_gen.txt
```

## Configuration

### Add API Key to Environment
Add your Gemini API key to `.env.misc`:
```
GEMINI_API_KEY="your-google-gemini-api-key-here"
```

**Note:** The script will fallback to `OPENAI_API_KEY` if `GEMINI_API_KEY` is not set, as Google Gemini can sometimes be accessed through OpenAI-compatible endpoints depending on your service provider.

## Usage

### Run the Script
```powershell
python generate_product_images.py
```

### What It Does
1. **Loads Product Data** - Reads from `OttoFreiGems_DIYSettings_EarringPairs_CORRECTED.json`
2. **Creates Directories** - Sets up:
   - `image_cache/gemstones/` - Cached gemstone images
   - `image_cache/settings/` - Cached setting images
   - `gemstone-earrings/public/images/products/` - Final generated images
3. **Processes Each Product**:
   - Checks if image already exists (skips if so)
   - Scrapes gemstone image from supplier URL
   - Scrapes setting image from supplier URL
   - Calls Gemini API to generate composite image
   - Saves result as `{pair_id}.jpg`

### Progress Tracking
The script displays:
- Current product being processed
- Scraping status for each image
- API call status
- Success/failure for each product
- Final summary with counts

### Features
- **Caching** - Component images are cached locally to avoid repeated scraping
- **Rate Limiting** - 2 second delay between requests to be respectful to servers
- **Resume Support** - Skips products that already have generated images
- **Error Handling** - Continues processing even if individual products fail
- **Ctrl+C Support** - Can interrupt and resume later

## Output

Generated images will be saved to:
```
gemstone-earrings/public/images/products/{pair_id}.jpg
```

For example:
- `ES218_Round_Faceted_Tanzanite_6mm.jpg`
- `ES345_Round_Faceted_Lab-Created_Blue_Sapphire_4.5mm.jpg`

## Troubleshooting

### "GEMINI_API_KEY not found"
Add your API key to `.env.misc` file in the same directory.

### "Could not find image on page"
The scraping selectors might need adjustment for specific product pages. The script tries multiple common selectors.

### API Rate Limits
Google Gemini API has rate limits. If you hit them:
- The script will display the error
- Wait a few minutes and restart
- The script will resume from where it left off

### API Costs
Nano Banana Pro (Gemini 3 Pro Image) costs vary by provider:
- Google Vertex AI: ~$0.15 per image
- Alternative providers (kie.ai, nanobananaapi.ai): $0.09-0.12 per image
- For 244 products: ~$22-37 total

## Next Steps

After generating images, update the website components to display them:

1. **ProductCard Component** (`gemstone-earrings/components/ProductCard.tsx`)
2. **Product Detail Page** (`gemstone-earrings/app/products/[id]/page.tsx`)
3. **Cart Page** (`gemstone-earrings/app/cart/page.tsx`)

Replace emoji placeholders (💎) with:
```typescript
<img src={`/images/products/${product.pair_id}.jpg`} alt={product.pair_name} />
```

## Script Details

- **Location:** `C:\Users\RogerIdaho\Etsy\Etsyv0900\generate_product_images.py`
- **Products:** 244 unique earring pairs
- **Model:** gemini-3-pro-image-preview (Nano Banana Pro)
- **Output Resolution:** 1024x1024 pixels (configurable)
- **Format:** JPEG

## API Documentation References

- Google Gemini API: https://ai.google.dev/gemini-api/docs/nanobanana
- Nano Banana Pro: https://deepmind.google/models/gemini-image/pro/
- API Pricing: https://ai.google.dev/pricing
