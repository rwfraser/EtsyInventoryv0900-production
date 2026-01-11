# Requirements.txt Cleanup - January 10, 2026

## Summary
Reduced dependencies from **137 packages** to **7 core packages** (plus Django's auto-installed dependencies).

## Backup
Original requirements saved to: `requirements.txt.backup`

## Removed Packages (130 packages)

### Major Removals:
- **Anthropic AI SDK** - Not used (OpenAI only)
- **LangChain ecosystem** (9 packages) - langchain, langgraph, langsmith, etc.
- **FastAPI + Uvicorn** - Not used (Django only)
- **Flask + Werkzeug** - Not used
- **Supabase SDK** (5 packages) - Cloud database not configured
- **mitmproxy** (3 packages) - HTTP proxy not used
- **moviepy + imageio** - Media processing not used
- **pyiceberg** - Data lakehouse not used
- **yt-dlp** - YouTube downloader not used

### Additional Removals:
- langchain-tavily (Tavily API key in .env but not used)
- ldap3, bcrypt, argon2-cffi (authentication packages beyond Django)
- tornado, various crypto/SSL packages
- numpy, pillow (no image/data processing in current code)
- All associated sub-dependencies

## Kept Packages (7 core + Django dependencies)

### Core Framework:
- **Django 5.2.8** - Web framework, ORM, admin interface

### Web Scraping:
- **playwright 1.41.2** - Headless browser for JavaScript-heavy sites
- **beautifulsoup4 4.14.3** - HTML parsing
- **requests 2.32.5** - HTTP requests
- **soupsieve 2.8.1** - CSS selectors for BeautifulSoup

### AI Integration:
- **openai 2.8.1** - AI-powered data extraction

### Utilities:
- **python-dotenv 1.2.1** - Secure environment variable management

### Auto-installed by Django:
- asgiref
- sqlparse
- tzdata (Windows)

## Installation

### Fresh Install:
```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
python -m playwright install chromium
```

### Upgrading Existing Environment:
```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Option 1: Clean install (recommended)
pip uninstall -y -r requirements.txt.backup
pip install -r requirements.txt

# Option 2: Fresh virtual environment (safest)
deactivate
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install chromium
```

## Verification

All current functionality preserved:
- ✅ Django web framework
- ✅ Database models and migrations
- ✅ Admin interface
- ✅ Web scraping (Playwright + BeautifulSoup)
- ✅ AI-powered scraping (OpenAI)
- ✅ Environment variable management
- ✅ All management commands

## Disk Space Savings

Approximate savings: **~2-3 GB** of installed packages and dependencies.

## Rollback

To restore original dependencies:
```powershell
pip install -r requirements.txt.backup
```

## Notes

- If you need ERD generation, uncomment `graphviz` in requirements.txt
- LangChain/Supabase/FastAPI can be re-added if future features require them
- Current codebase analyzed to confirm no usage of removed packages
