"""
Debug script to identify what GEMINI_API_KEY value is being loaded
"""
import os
from dotenv import load_dotenv

print("=" * 70)
print("GEMINI API KEY DIAGNOSTIC TEST")
print("=" * 70)

# Test 1: Check environment before loading .env.misc
print("\n1. Checking environment BEFORE loading .env.misc:")
print(f"   GEMINI_API_KEY from os.getenv(): {repr(os.getenv('GEMINI_API_KEY'))}")
print(f"   OPENAI_API_KEY from os.getenv: {os.getenv('OPENAI_API_KEY')[:20] if os.getenv('OPENAI_API_KEY') else 'None'}...")

# Load .env.misc
from dotenv import load_dotenv
load_dotenv('.env.misc')

print("\n" + "="*70)
print("After loading .env.misc:")
print("="*70)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print(f"\nGEMINI_API_KEY found: {bool(GEMINI_API_KEY)}")
if GEMINI_API_KEY:
    print(f"GEMINI_API_KEY length: {len(GEMINI_API_KEY)}")
    print(f"GEMINI_API_KEY first 20 chars: {GEMINI_API_KEY[:20]}...")
    print(f"GEMINI_API_KEY last 5 chars: ...{GEMINI_API_KEY[-5:]}")
    print(f"Full key (will be redacted in output): {GEMINI_API_KEY}")
else:
    print("GEMINI_API_KEY is None or empty")

print("\n" + "="*60)
print("OPENAI_API_KEY fallback check:")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_KEY:
    print(f"OpenAI key found, starts with: {OPENAI_API_KEY[:10]}...")
else:
    print("OPENAI_API_KEY not found")
