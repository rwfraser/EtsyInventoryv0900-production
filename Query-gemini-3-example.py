# To run this code you need to install the following dependencies:
# pip install google-genai
# script to test Gemini Chat API key and interface.  
# Embed API key in .env file and hard code text string query in 'types.Part.from_text'
# For a turnkey Chat service, wrap this script in a web or app interface.     
import base64
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv



def generate():
    load_dotenv()# Get API key from environment
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    # Initialize Gemini client
    client = genai.Client(api_key=api_key)
    # client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"),)

    model = "gemini-3-flash-preview"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="Can you tell me the weather forecase for Kalispell, Montana?"),
            ],
        ),
    ]
    tools = [
        types.Tool(googleSearch=types.GoogleSearch(
        )),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
        ),
        tools=tools,
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")

if __name__ == "__main__":
    generate()
