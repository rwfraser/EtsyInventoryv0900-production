# AI Earring Image Generation Pipeline

## Overview
This pipeline automates the generation of AI-composite earring images using Google's Gemini Nano Banana Pro, scraping product images from suppliers and deploying to a Next.js website on Vercel.

## Prerequisites

### 1. Install Required Packages
```powershell
pip install google-genai pillow requests python-dotenv beautifulsoup4
```

### 2. Environment Setup
Ensure your `.env` file contains:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Required Files
- `OttoFreiGems_DIYSettings_EarringPairs_2026_01_18_001.json` - Input data (254 combinations)
- `gemstone-earrings/` - Next.js website directory

## Pipeline Scripts

### 1. `generate_earring_images.py`
**Main AI generation script** - Processes earring combinations through the complete pipeline.

**Features:**
- ✅ Scrapes setting images from https://diyjewelry.us
- ✅ Scrapes gemstone images from https://www.ottofrei.com
- ✅ Generates composite earring images via Gemini AI
- ✅ Comprehensive logging to `logs/` directory
- ✅ Image caching (avoids re-downloading)
- ✅ Error handling with retry logic
- ✅ API rate limiting (2s between requests)
- ✅ Quota handling (30-minute wait on quota exceeded)
- ✅ Currently set to TEST MODE (processes first item only)

**Usage:**
```powershell
python generate_earring_images.py
```

**Output:**
- `generated_earrings/images/settings/` - Downloaded setting images
- `generated_earrings/images/gemstones/` - Downloaded gemstone images
- `generated_earrings/images/generated/` - AI-generated earring images
- `generated_earrings/processed_earrings.json` - Processed data with image paths
- `logs/earring_generation_YYYYMMDD_HHMMSS.log` - Detailed log file

**Console Output:**
- `[READ]` - File/URL read operations
- `[WRITE]` - File write operations
- `[API]` - Gemini API calls
- `[CACHE]` - Using cached images
- `[SUCCESS]` - Successful operations
- `[ERROR]` - Errors and failures
- `[RETRY]` - Retry attempts
- `[WAIT]` - Rate limiting delays

### 2. `deploy_to_website.py`
**Deployment script** - Copies generated images and updates Next.js website data.

**Features:**
- Copies AI-generated images to Next.js public folder
- Merges new products into existing products.json
- Avoids duplicates by pair_id
- Updates metadata timestamps

**Usage:**
```powershell
python deploy_to_website.py
```

**Output:**
- Copies images to `gemstone-earrings/public/images/generated/`
- Updates `gemstone-earrings/public/products.json`

## Complete Workflow

### Step 1: Generate AI Images (TEST MODE)
```powershell
# Currently processes FIRST ITEM ONLY for testing
python generate_earring_images.py
```

**Monitor:**
- Watch console for real-time progress
- Check log file for detailed trace
- Review generated images in `generated_earrings/images/generated/`

### Step 2: Verify Generated Images
```powershell
# View the generated image
Start-Process "generated_earrings\images\generated\ES216_Round_Faceted_Pink_Amethyst_4mm.jpg"

# Check the log file
Get-Content logs\earring_generation_*.log | Select-Object -Last 50
```

### Step 3: Deploy to Website
```powershell
python deploy_to_website.py
```

### Step 4: Commit and Push to GitHub
```powershell
cd gemstone-earrings
git add .
git commit -m "Add AI-generated earrings - Batch 1"
git push
```

### Step 5: Vercel Auto-Deployment
Vercel will automatically detect the GitHub push and deploy the updated website.

## Scaling to All 254 Combinations

### Edit `generate_earring_images.py`
Change line 327:
```python
# FROM (TEST MODE):
combinations_to_process = data['combinations'][:1]

# TO (FULL PROCESSING):
combinations_to_process = data['combinations']
```

### Considerations for Full Run:
- **Time:** ~10-15 minutes for 254 combinations (with 2s rate limit)
- **API Quota:** Monitor Gemini API usage limits
- **Errors:** Script will retry failed items 3 times
- **Resume:** Cached images allow resuming from failures

## Error Handling

### Common Issues:

**1. Image Scraping Failures**
- Script tries multiple CSS selectors
- Logs which selectors failed
- Returns None, triggers retry logic

**2. API Quota Exceeded**
- Script detects "quota" or "rate limit" errors
- Waits 30 minutes automatically
- Retries the failed request

**3. Network Timeouts**
- 30-second timeout on HTTP requests
- Retries up to 3 times per combination
- Logs failures to review later

**4. Invalid Images**
- PIL verifies image validity after download
- Catches corrupted downloads
- Retries with fresh download

## Directory Structure
```
Etsyv0900/
├── generate_earring_images.py          # Main generation script
├── deploy_to_website.py                # Deployment script
├── OttoFreiGems...001.json            # Input data
├── .env                                # API keys (gitignored)
├── logs/                               # Log files
│   └── earring_generation_*.log
├── generated_earrings/                 # Output directory
│   ├── processed_earrings.json        # Processed data
│   └── images/
│       ├── settings/                   # Downloaded settings
│       ├── gemstones/                  # Downloaded gemstones
│       └── generated/                  # AI-generated images
└── gemstone-earrings/                  # Next.js website
    └── public/
        ├── images/generated/           # Deployed images
        └── products.json               # Website product data
```

## Monitoring and Logs

### Real-time Monitoring:
- Watch console output for live progress
- Each operation tagged with type: [READ], [WRITE], [API], etc.

### Log Files:
- Timestamped filename for each run
- Complete trace of all operations
- Stack traces for exceptions
- Useful for debugging failures

### Success Metrics:
- Successfully processed count
- Failed count and IDs
- Total time elapsed
- Output file locations

## API Rate Limits

**Current Settings:**
- 2 seconds between API calls
- 30-minute wait on quota exceeded
- Max 3 retries per combination

**Adjust if needed:**
Edit constants in `generate_earring_images.py`:
```python
RATE_LIMIT_DELAY = 2          # seconds
API_RETRY_WAIT = 30 * 60      # 30 minutes
MAX_RETRIES = 3               # attempts
```

## Vercel Deployment

The Next.js website is configured for automatic deployment:
1. Git push to repository triggers Vercel webhook
2. Vercel builds Next.js app
3. Deploys to production
4. New products immediately available

**Verify deployment:**
- Check Vercel dashboard for build status
- Visit website to see new products
- Monitor build logs for errors

## Troubleshooting

### Script Won't Start:
```powershell
# Check Python and packages
python --version
pip list | Select-String "genai|pillow|requests|dotenv|beautifulsoup4"

# Verify .env file
Test-Path .env
Get-Content .env | Select-String "GEMINI_API_KEY"
```

### No Images Generated:
- Check log file for specific errors
- Verify URLs are accessible in browser
- Test API key with sample script
- Check internet connection

### Deployment Fails:
```powershell
# Verify paths exist
Test-Path generated_earrings\processed_earrings.json
Test-Path gemstone-earrings\public\products.json

# Check permissions
Get-Acl gemstone-earrings\public
```

## Next Steps

1. ✅ Test with first item (current mode)
2. Review generated image quality
3. Adjust AI prompt if needed
4. Scale to full 254 combinations
5. Deploy to production website
6. Monitor user engagement
7. Iterate on prompt/generation quality

## Support

For issues or questions:
- Check log files first: `logs/earring_generation_*.log`
- Review console output for immediate errors
- Verify all prerequisites are met
- Test with single item before full run
