import urllib.request
import uuid

boundary = uuid.uuid4().hex
body = (
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"file\"; filename=\"test.pdf\"\r\n"
    f"Content-Type: application/pdf\r\n\r\n"
    f"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\r\n"
    f"--{boundary}--\r\n"
).encode('utf-8')

req = urllib.request.Request("http://127.0.0.1:8003/upload", data=body, method="POST")
req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

try:
    with urllib.request.urlopen(req) as res:
        print("STATUS:", res.status)
        print("BODY:", res.read().decode())
except urllib.error.HTTPError as e:
    print("STATUS:", e.code)
    print("BODY:", e.read().decode())
except Exception as e:
    print("EXCEPTION:", e)
