import requests

url = "http://127.0.0.1:8003/upload"
with open("sample.pdf", "rb") as f:
    res = requests.post(url, files={"file": f})
print("STATUS:", res.status_code)
print("BODY:", res.text)

