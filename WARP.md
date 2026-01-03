# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Django 4.2 project called **EtsyInventoryv0900** for managing Etsy inventory. The project uses SQLite as its database and is currently in early development with only the base Django project structure in place.

## Environment Setup

### Virtual Environment
- Virtual environment location: `venv/` (Windows)
- Activate with: `.\venv\Scripts\Activate.ps1` (PowerShell)
- Deactivate with: `deactivate`

### Dependencies
The project has extensive dependencies including:
- **Django 5.2.8** (note: settings.py indicates 4.2.24, but requirements.txt shows 5.2.8)
- **LangChain ecosystem** (langchain, langgraph, langsmith) - for AI/LLM capabilities
- **Supabase SDK** - for potential cloud database/storage integration
- **FastAPI & Flask** - alongside Django, suggesting microservices or API development
- **OpenAI & Anthropic SDKs** - for AI model integrations
- **mitmproxy** - for HTTP/HTTPS traffic inspection
- **moviepy & imageio** - for media processing

Install all dependencies: `pip install -r requirements.txt`

## Common Commands

### Development Server
```powershell
python manage.py runserver
```
Access at: http://127.0.0.1:8000/

### Database Management
```powershell
# Run migrations
python manage.py migrate

# Create migrations after model changes
python manage.py makemigrations

# Create superuser for admin access
python manage.py createsuperuser
```

### Django Shell
```powershell
python manage.py shell
```

### Static Files
```powershell
python manage.py collectstatic
```

## Project Architecture

### Django Project Structure
- **EtsyInventoryv0900/** - Main project directory containing settings and configuration
  - `settings.py` - Django settings (DEBUG=True, SQLite database, default apps only)
  - `urls.py` - Root URL configuration (currently only admin route)
  - `wsgi.py` / `asgi.py` - WSGI/ASGI application entry points
- **manage.py** - Django management script

### Database
- SQLite database: `db.sqlite3` (not tracked in git)
- Located at project root

### Current State
- No custom Django apps created yet
- Only default Django contrib apps installed (admin, auth, contenttypes, sessions, messages, staticfiles)
- No custom models, views, or templates
- Admin interface available at `/admin/` but requires superuser creation

## Development Notes

### Settings Configuration
- `SECRET_KEY` is currently using the default insecure key - should be changed for any deployment
- `DEBUG = True` - must be set to False for production
- `ALLOWED_HOSTS = []` - needs to be configured for production deployment

### Next Development Steps
When creating Etsy inventory functionality, you'll likely need to:
1. Create a Django app: `python manage.py startapp <app_name>`
2. Add the app to `INSTALLED_APPS` in `settings.py`
3. Define models for Etsy inventory items
4. Create and run migrations
5. Register models with Django admin or create custom views

### Dependencies Context
The extensive dependency list suggests this project may evolve to include:
- AI-powered inventory management or recommendations (LangChain, OpenAI, Anthropic)
- External API integrations (FastAPI/Flask microservices)
- Cloud storage/database (Supabase)
- Media processing capabilities (moviepy, imageio)
- API debugging/monitoring (mitmproxy)

When adding new features, verify which dependencies are actually needed and consider removing unused ones to reduce project complexity.
