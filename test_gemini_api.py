"""
Test script to verify Gemini API key works
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv('.env.misc')

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print(f"API Key loaded: {'Yes' if GEMINI_API_KEY else 'No'}")
if GEMINI_API_KEY:
    print(f"API Key starts with: {GEMINI_API_KEY[:10]}...")

# Test simple text generation first
url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY
}

payload = {
    "contents": [{
        "parts": [{
            "text": "Say hello"
        }]
    }]
}

print("\nTesting Gemini API with simple text generation...")
try:
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("✓ API key is valid!")
        result = response.json()
        if 'candidates' in result:
            text = result['candidates'][0]['content']['parts'][0]['text']
            print(f"Response: {text}")
    else:
        print(f"✗ Error: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"✗ Exception: {e}")
