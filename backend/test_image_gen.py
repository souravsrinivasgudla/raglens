import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://127.0.0.1:8003/generate-image"

def test_image_gen():
    payload = {"prompt": "A beautiful sunset over a calm ocean in pixel art style"}
    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code == 200:
            data = response.json()
            if "image" in data and data["image"].startswith("data:image/png;base64,"):
                print("SUCCESS: Image generated and returned as base64 string.")
            else:
                print(f"FAILURE: Unexpected response format: {data}")
        else:
            print(f"FAILURE: Server returned {response.status_code}: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    # Note: Make sure the backend server is running on port 8003
    print("Testing image generation endpoint...")
    test_image_gen()
