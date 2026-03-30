import requests

url = "http://127.0.0.1:8000/query"
payload = {"question": "what is genai?"}
try:
    res = requests.post(url, json=payload)
    print("STATUS:", res.status_code)
    print("BODY:", res.text)
except Exception as e:
    print("ERROR:", e)
