"""
Test script to verify OPENAI_API_KEY can be loaded from .env file
and successfully make an API call.
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Get API key from environment
api_key = os.getenv('OPENAI_API_KEY')

if not api_key:
    print("❌ ERROR: OPENAI_API_KEY not found in environment variables")
    print("Please check your .env file")
    exit(1)

print(f"✓ API Key loaded from .env file")
print(f"  Key prefix: {api_key[:8]}...")
print(f"  Key suffix: ...{api_key[-4:]}")
print()

# Initialize OpenAI client
try:
    client = OpenAI(api_key=api_key)
    print("✓ OpenAI client initialized")
except Exception as e:
    print(f"❌ ERROR initializing OpenAI client: {e}")
    exit(1)

# Make a simple test API call
print("\nMaking test API call...")
try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": "Say 'API key working!' if you receive this message."
            }
        ],
        max_tokens=20
    )
    
    result = response.choices[0].message.content
    print(f"✓ API call successful!")
    print(f"  Response: {result}")
    print()
    print("="*60)
    print("SUCCESS: OpenAI API key is properly configured!")
    print("="*60)
    
except Exception as e:
    print(f"❌ ERROR making API call: {e}")
    exit(1)
