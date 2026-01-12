"""
Test script to verify .env file loading and OpenAI API key functionality.
"""
import os
import subprocess
from dotenv import load_dotenv
from openai import OpenAI

# Check initial environment variable state
env_before = os.getenv('OPENAI_API_KEY')
print(f"Environment variable before clearing: {repr(env_before)}")

# Clear OPENAI_API_KEY environment variable using PowerShell
result = subprocess.run(
    ["powershell", "-Command", "$env:OPENAI_API_KEY = $null"],
    shell=True,
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print(f"❌ ERROR: PowerShell command failed with exit code {result.returncode}")
    print(f"STDERR: {result.stderr}")
    exit(1)
else:
    print("✓ PowerShell command executed successfully")

# Verify the environment variable was cleared
env_after = os.getenv('OPENAI_API_KEY')
print(f"Environment variable after clearing: {repr(env_after)}")

# Load environment variables from .env file
load_dotenv()

# Get API key from environment
api_key = os.getenv('OPENAI_API_KEY')

if not api_key:
    print("❌ ERROR: OPENAI_API_KEY not found in environment variables")
    print("Make sure .env file exists and contains OPENAI_API_KEY=your_key_here")
    exit(1)

# Display masked key for verification
print(f"✓ API Key loaded: {api_key[:8]}...{api_key[-4:]}")
print(f"✓ Key length: {len(api_key)} characters")

# Initialize OpenAI client
try:
    client = OpenAI(api_key=api_key)
    print("✓ OpenAI client initialized successfully")
except Exception as e:
    print(f"❌ ERROR initializing OpenAI client: {e}")
    exit(1)

# Make a simple test API call
try:
    print("\nMaking test API call...")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": "Say 'API key is working!' if you can read this."}
        ],
        max_tokens=20
    )
    
    result = response.choices[0].message.content
    print(f"✓ API Response: {result}")
    print("\n✅ SUCCESS: .env file and API key are working correctly!")
    
except Exception as e:
    print(f"❌ ERROR making API call: {e}")
    print("\nThis could mean:")
    print("  - The API key is invalid or revoked")
    print("  - You don't have API credits")
    print("  - Network connectivity issue")
    exit(1)
