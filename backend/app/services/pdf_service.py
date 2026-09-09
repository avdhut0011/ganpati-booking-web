import os
import sys
import base64
import tempfile
import subprocess
from io import BytesIO
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from xhtml2pdf import pisa
from app.config import settings

FONT_REGISTERED = False

def register_fonts():
    global FONT_REGISTERED
    if FONT_REGISTERED:
        return
    font_candidates = [
        ("Mangal", "backend/static/fonts/Mangal.ttf"),
        ("Mangal", "static/fonts/Mangal.ttf"),
        ("Mangal", "C:/Windows/Fonts/mangal.ttf"),
        ("Nirmala", "C:/Windows/Fonts/Nirmala.ttf"),
        ("Arial", "C:/Windows/Fonts/arial.ttf")
    ]
    for name, path in font_candidates:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont(name, path))
                FONT_REGISTERED = True
                print(f"[PDF] Devanagari font '{name}' registered successfully from {path}.")
                break
            except Exception as e:
                print(f"[PDF] Could not register font {name}: {e}")

import shutil
from app.services import s3_service

def get_browser_path():
    # 1. Check environment variable override
    env_path = os.environ.get("CHROMIUM_PATH") or os.environ.get("CHROME_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    # 2. Check system PATH
    for cmd in ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable", "msedge"]:
        which_path = shutil.which(cmd)
        if which_path:
            return which_path

    # 3. Check Windows & Linux standard locations
    candidates = [
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None

def generate_marathi_pdf(data: dict) -> dict:
    """
    Generate a high-quality, beautifully formatted Marathi booking bill PDF
    matching the exact visual format of the sample bill.
    """
    booking_id = data.get("bookingId", "")
    booking_date = data.get("bookingDate", "")
    customer_name = data.get("customerName", "")
    mobile_number = data.get("mobileNumber", "")
    email_id = data.get("emailId", "-")
    statue_number = data.get("statueNumber", "")
    payment_mode = data.get("paymentMode", "कॅश")
    booked_by_owner = data.get("bookedByOwner", "")

    # Statue photo HTML
    image_base64 = data.get("imageBase64", "")
    if image_base64 and len(image_base64) > 50:
        statue_img_html = f"""
        <div style="width:160px; height:170px; border-radius:14px; overflow:hidden;
                    border:3px solid #d35400; background:#fff; text-align:center; box-sizing:border-box;">
            <img src="{image_base64}" style="width:160px; height:170px; object-fit:cover;"/>
        </div>"""
    else:
        statue_img_html = """
        <div style="width:160px; height:170px; border-radius:14px;
                    border:3px solid #d35400; background:#fef9e7;
                    text-align:center; padding:40px 10px; color:#d35400;
                    font-size:13px; font-weight:bold; box-sizing:border-box;">
            <div style="font-size:32px; margin-bottom:6px;">🌺</div>
            मूर्ती फोटो उपलब्ध नाही
        </div>"""

    # Checkbox icons
    cash_chk = "☑" if payment_mode == "कॅश" else "☐"
    upi_chk = "☑" if payment_mode == "UPI" else "☐"
    online_chk = "☑" if payment_mode == "ऑनलाईन" else "☐"

    # Dynamic owner checkboxes from DB owner list
    owner_names = data.get("ownerNames", [])
    if not owner_names and booked_by_owner:
        owner_names = [booked_by_owner]
    owner_checkboxes_html = " &nbsp;&nbsp;&nbsp; ".join(
        f'{"☑" if booked_by_owner == name else "☐"} {name}' for name in owner_names
    )

    total_amt = float(data.get("totalAmount", 0))
    advance_amt = float(data.get("advanceAmount", 0))
    balance_amt = float(data.get("balanceAmount", 0))

    font_file = os.path.abspath(os.path.join("static", "fonts", "Mangal.ttf")).replace("\\", "/")

    stall_name = data.get("stallName") or data.get("stall_name") or "सदिच्छा कला केंद्र"
    stall_number = data.get("stallNumber") or data.get("stall_number") or "स्टॉल क्र.१०"
    location_address = data.get("locationAddress") or data.get("location_address") or "उदाजी महाराज म्युझियम ऑफ एज्युकेशन हेरिटेज, आकाशवाणी टॉवर जवळ, गंगापूर रोड, नाशिक"
    contact_phone = data.get("contactPhone") or data.get("contact_phone") or "शिव : ९१५८१९९३००<br/>राहुल : ९६५७५०२१९१<br/>हर्षद : ८३९०००१३९०"

    def fmt(n):
        return f"{n:,.0f}"

    html_content = f"""<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8"/>
  <style>
    @font-face {{
      font-family: 'Mangal';
      src: url('file:///{font_file}');
    }}
    @page {{
      size: A4 portrait;
      margin: 12mm 15mm;
    }}
    body {{
      font-family: 'Mangal', 'Nirmala', 'Arial', sans-serif;
      color: #2c3e50;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 14px;
      line-height: 1.4;
    }}
    .outer-border {{
      border: 3px double #d35400;
      padding: 20px 22px;
      border-radius: 14px;
      background: #ffffff;
    }}
    .header-box {{
      text-align: center;
      margin-bottom: 8px;
    }}
    .god-title {{
      color: #d35400;
      font-size: 15px;
      font-weight: bold;
    }}
    .shop-title {{
      color: #4a235a;
      font-size: 30px;
      font-weight: 800;
      margin: 3px 0 6px 0;
    }}
    .shop-tagline {{
      background: #fef5e7;
      border: 1px solid #f5cba7;
      color: #d35400;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 12.5px;
      font-weight: bold;
      display: inline-block;
    }}
    .banner-title {{
      color: #c0392b;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin: 12px 0 15px 0;
      letter-spacing: 1px;
    }}
    .info-table {{
      width: 100%;
      margin-bottom: 15px;
      border-collapse: collapse;
    }}
    .photo-col {{
      width: 170px;
      vertical-align: top;
    }}
    .details-col {{
      vertical-align: top;
      padding-left: 20px;
    }}
    .info-row {{
      padding: 7px 0;
      border-bottom: 1px dashed #fad7a0;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
    }}
    .info-row:last-child {{
      border-bottom: none;
    }}
    .lbl {{
      font-weight: bold;
      color: #34495e;
    }}
    .val {{
      font-weight: bold;
      color: #111111;
    }}
    .amount-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }}
    .amount-table th {{
      background: linear-gradient(90deg, #d35400 0%, #6c3483 100%);
      color: #ffffff;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      border: 1px solid #a04000;
    }}
    .amount-table td {{
      padding: 10px 14px;
      font-size: 15px;
      font-weight: bold;
      text-align: center;
      border: 1px solid #f5cba7;
      background: #fdfbf7;
    }}
    .checkbox-section {{
      background: #fdfbf7;
      border: 1.5px solid #f5cba7;
      border-radius: 10px;
      padding: 12px 18px;
      margin-bottom: 15px;
    }}
    .checkbox-group-title {{
      font-weight: bold;
      color: #6c3483;
      font-size: 13.5px;
      margin-bottom: 6px;
    }}
    .checkbox-items {{
      display: flex;
      gap: 25px;
      font-size: 13.5px;
      font-weight: bold;
    }}
    .chk-box {{
      font-size: 15px;
      margin-right: 4px;
    }}
    .footer-box {{
      text-align: center;
      margin-top: 15px;
      border-top: 2px solid #f5cba7;
      padding-top: 12px;
    }}
    .thanks-txt {{
      color: #d35400;
      font-size: 15.5px;
      font-weight: bold;
      margin-bottom: 4px;
    }}
    .sub-txt {{
      color: #7f8c8d;
      font-size: 12px;
      margin-bottom: 12px;
    }}
    .contact-card {{
      background: linear-gradient(135deg, #fdf5e6 0%, #faebd7 100%);
      border: 1.5px solid #f39c12;
      padding: 12px 18px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
    }}
    .card-left {{
      font-size: 12px;
      line-height: 1.5;
    }}
    .card-right {{
      text-align: right;
      font-size: 12.5px;
      font-weight: bold;
      line-height: 1.6;
    }}
    .motto-txt {{
      color: #c0392b;
      font-weight: bold;
      font-size: 17px;
      margin-top: 12px;
    }}
  </style>
</head>
<body>
<div class="outer-border">

  <!-- HEADER -->
  <div class="header-box">
    <div class="god-title">🌺 ॥ श्री गणेशाय नमः ॥ 🌺</div>
    <div class="shop-title">{stall_name}</div>
    <div class="shop-tagline">✨ आमच्या येथे पेण येथील सुबक आणि आकर्षक, मातीच्या मूर्ती मिळतील ✨</div>
  </div>

  <!-- BANNER -->
  <div class="banner-title">🚩 ✦ बुकिंग बिल ✦ 🚩</div>

  <!-- TOP SECTION -->
  <table class="info-table">
    <tr>
      <td class="photo-col">{statue_img_html}</td>
      <td class="details-col">
        <div class="info-row">
          <span class="lbl">✦ बुकिंग क्रमांक :</span>
          <span class="val" style="color:#c0392b; font-size:15.5px;">{booking_id}</span>
        </div>
        <div class="info-row">
          <span class="lbl">✦ दिनांक :</span>
          <span class="val">{booking_date}</span>
        </div>
        <div class="info-row">
          <span class="lbl">✦ ग्राहकाचे नाव :</span>
          <span class="val" style="font-size:15px; color:#6c3483;">{customer_name}</span>
        </div>
        <div class="info-row">
          <span class="lbl">✦ मोबाईल नंबर :</span>
          <span class="val">{mobile_number}</span>
        </div>
        <div class="info-row">
          <span class="lbl">✦ ईमेल आयडी :</span>
          <span class="val">{email_id}</span>
        </div>
        <div class="info-row">
        </div>
        <div class="amt-pill" style="background:#ebf5fb; color:#2980b9;">
          <span>₹ जमा रक्कम :</span> <span style="background:#fff; padding:2px 12px; border-radius:12px; font-size:15px;">₹ {fmt(advance_amt)}</span>
        </div>
        <div class="amt-pill" style="background:#fadbd8; color:#c0392b;">
          <span>₹ बाकी रक्कम :</span> <span style="background:#fff; padding:2px 12px; border-radius:12px; font-size:16px; font-weight:800;">₹ {fmt(balance_amt)}</span>
        </div>
      </td>
      <td>
        <div style="font-weight:bold; color:#4a235a; margin-bottom:8px; font-size:14px;">
          पेमेंट प्रकार:
        </div>
        <div style="font-size:14.5px; font-weight:bold; margin-bottom:14px; color:#2c3e50;">
          {cash_chk} कॅश &nbsp;&nbsp;&nbsp; {upi_chk} UPI &nbsp;&nbsp;&nbsp; {online_chk} ऑनलाईन
        </div>
        
        <hr style="border:0; border-top:1px dashed #fad7a0; margin:10px 0;"/>
        
        <div style="font-weight:bold; color:#4a235a; margin-bottom:8px; font-size:14px;">
          बुकिंग करणारा:
        </div>
        <div style="font-size:14.5px; font-weight:bold; color:#2c3e50;">
          {owner_checkboxes_html}
        </div>
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <div class="footer-box">
    <div class="thanks-txt">🙏 आपल्या विश्वासाबद्दल मनःपूर्वक आभार! 🙏</div>
    <div class="sub-txt">✤ सुंदर मूर्ती, सुंदर संस्कार आणि आपल्या आनंदासाठी आमची प्रामाणिक सेवा. ✤</div>
    
    <div class="contact-card">
      <div class="card-left">
        <strong>{stall_name}, {stall_number}</strong><br/>
        {location_address}
      </div>
      <div class="card-right">
        {contact_phone}
      </div>
    </div>
    
    <div class="motto-txt">🌺 ॥ गणपती बाप्पा मोरया ॥ 🌺</div>

    <div class="dev-footer">
      Develop by Avadhut Jagtap - Contact details Mob. 8390397800 and email - avadhutjagtap1341@gmail.com
    </div>
  </div>

</div>
</body>
</html>"""

    os.makedirs(settings.PDFS_DIR, exist_ok=True)
    filename = f"Bill_{booking_id}.pdf"
    filepath = os.path.join(settings.PDFS_DIR, filename)

    browser_exe = get_browser_path()
    if browser_exe:
        try:
            tmp = tempfile.NamedTemporaryFile("w", delete=False, suffix=".html", encoding="utf-8")
            tmp.write(html_content)
            tmp_html_path = tmp.name
            tmp.close()

            file_uri = "file:///" + os.path.abspath(tmp_html_path).replace("\\", "/")

            abs_filepath = os.path.abspath(filepath)
            cmd = [
                browser_exe,
                "--headless",
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--print-to-pdf={abs_filepath}",
                file_uri
            ]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            if os.path.exists(tmp_html_path):
                os.remove(tmp_html_path)

            if os.path.exists(abs_filepath):
                with open(abs_filepath, "rb") as f:
                    pdf_bytes = f.read()
                pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
                print(f"[PDF Browser] Successfully generated PDF: {abs_filepath} ({len(pdf_bytes)} bytes)")
                
                final_pdf_url = f"/uploads/pdfs/{filename}"
                if settings.USE_CLOUD_STORAGE and settings.AWS_S3_BUCKET_NAME:
                    s3_url = s3_service.upload_file_to_s3(abs_filepath, f"pdfs/{filename}", content_type="application/pdf")
                    if s3_url:
                        final_pdf_url = s3_url

                return {
                    "pdfUrl": final_pdf_url,
                    "pdfBase64": pdf_base64
                }
        except Exception as e:
            print(f"[PDF Browser Error] {e}. Falling back to xhtml2pdf...")

    # Fallback to xhtml2pdf
    register_fonts()
    try:
        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(
            html_content.encode("utf-8"),
            dest=pdf_buffer,
            encoding="utf-8"
        )

        if not pisa_status.err:
            pdf_bytes = pdf_buffer.getvalue()
            with open(filepath, "wb") as f:
                f.write(pdf_bytes)
            pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
            print(f"[PDF xhtml2pdf] Generated PDF: {filepath} ({len(pdf_bytes)} bytes)")

            final_pdf_url = f"/uploads/pdfs/{filename}"
            if settings.USE_CLOUD_STORAGE and settings.AWS_S3_BUCKET_NAME:
                s3_url = s3_service.upload_file_to_s3(filepath, f"pdfs/{filename}", content_type="application/pdf")
                if s3_url:
                    final_pdf_url = s3_url

            return {
                "pdfUrl": final_pdf_url,
                "pdfBase64": pdf_base64
            }
    except Exception as e:
        print(f"[PDF Fallback Exception] {e}")

    return {"pdfUrl": "", "pdfBase64": ""}
