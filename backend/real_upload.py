import os
from fpdf import FPDF
import requests

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, txt="Hello World!", ln=1, align="C")
pdf.output("sample.pdf")

url = "http://127.0.0.1:8003/upload"
with open("sample.pdf", "rb") as f:
    files = {"file": ("sample.pdf", f, "application/pdf")}
    res = requests.post(url, files=files)
    print("STATUS:", res.status_code)
    print("BODY:", res.text)
