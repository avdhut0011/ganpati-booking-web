# 📖 Google Apps Script Deployment & Setup Guide
## Ganpati Bappa Statue Booking & Marathi Bill PDF Platform

Follow these simple steps to deploy and run your Ganpati Bappa Statue Booking Platform on Google Cloud / Google Drive completely free using Google Apps Script!

---

## 📌 STEP 1: Set Up Google Sheet (Database)

1. Open [Google Sheets](https://sheets.google.com) and create a **New Spreadsheet**.
2. Name the Spreadsheet: `सदिच्छा कला केंद्र - गणपती मूर्ती बुकिंग`
3. Rename the first tab to **`Bookings`**.
4. In Row 1, add these exact **18 Column Headers**:

| Column Letter | Header Name (English) | Header Name (Marathi) |
|---|---|---|
| **A** | `Booking_ID` | बुकिंग क्रमांक |
| **B** | `Booking_Date` | दिनांक |
| **C** | `Customer_Name` | कस्टमरचे नाव |
| **D** | `Mobile_Number` | मोबाईल क्रमांक |
| **E** | `Email_ID` | ईमेल आयडी |
| **F** | `Statue_Number` | बुक केलेल्या मूर्ती क्रमांक |
| **G** | `Statue_Image_URL` | मूर्ती फोटो लिंक |
| **H** | `Total_Amount` | एकूण रक्कम (₹) |
| **I** | `Advance_Amount` | जमा रक्कम (₹) |
| **J** | `Balance_Amount` | बाकी रक्कम (₹) |
| **K** | `Payment_Mode` | पेमेंट प्रकार |
| **L** | `Booked_By_Owner` | बुकिंग करणारा |
| **M** | `Booking_Status` | बुकिंग स्थिती |
| **N** | `PDF_Bill_URL` | पीडीएफ बिल लिंक |
| **O** | `Final_Payment_Date` | अंतिम जमा दिनांक |
| **P** | `Final_Payment_Mode` | अंतिम पेमेंट प्रकार |
| **Q** | `Cancellation_Reason` | रद्द करण्याचे कारण |
| **R** | `Created_Timestamp` | नोंदणी वेळ |

---

## 📌 STEP 2: Create Google Drive Folders

1. Go to [Google Drive](https://drive.google.com).
2. Create two new folders:
   - Folder 1: `Ganpati_Statue_Photos` (For storing uploaded statue pictures).
   - Folder 2: `Ganpati_Bill_PDFs` (For storing generated Marathi PDF bills).
3. Open each folder, copy the **Folder ID** from the web browser URL bar:
   - Example URL: `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9...`
   - Folder ID is: `1a2b3c4d5e6f7g8h9...`

---

## 📌 STEP 3: Create Google Doc Bill Template (Optional / Recommended)

1. Go to [Google Docs](https://docs.google.com) and create a **New Blank Document**.
2. Design your Marathi Bill according to your printed template.
3. Insert these placeholder tags into your Google Doc where the data should appear:
   - `{{BOOKING_ID}}`
   - `{{DATE}}`
   - `{{CUSTOMER_NAME}}`
   - `{{MOBILE_NO}}`
   - `{{EMAIL}}`
   - `{{STATUE_NO}}`
   - `{{TOTAL_AMOUNT}}`
   - `{{ADVANCE_AMOUNT}}`
   - `{{BALANCE_AMOUNT}}`
   - `{{PAYMENT_MODE}}`
   - `{{BOOKED_BY}}`
   - `{{STATUS}}`
   - `{{STATUE_IMAGE}}` *(Add this tag inside the top-left box for the statue photo)*
4. Copy the **Google Doc File ID** from the URL bar.

*(Note: If you skip creating the Google Doc template, the platform automatically uses a built-in Marathi HTML-to-PDF template!)*

---

## 📌 STEP 4: Set Up Google Apps Script

1. Open your Google Sheet created in Step 1.
2. In the top menu, click **Extensions > Apps Script**.
3. In the left panel, replace the contents of `Code.gs` with the code provided in [`Code.gs`](file:///d:/Tesseract/Ganpati/Code.gs).
4. Click the **`+`** icon next to Files -> Select **HTML**.
5. Name the file **`Index`** (it will become `Index.html`).
6. Replace the contents of `Index.html` with the code provided in [`Index.html`](file:///d:/Tesseract/Ganpati/Index.html).

### ⚙️ Update Config IDs in `Code.gs`:
In `Code.gs`, update lines 10-18 with your Google Drive Folder IDs and Doc Template ID:
```javascript
const CONFIG = {
  SPREADSHEET_ID: "", // Auto-detects current sheet
  SHEET_NAME: "Bookings",
  DOC_TEMPLATE_ID: "YOUR_DOC_TEMPLATE_ID", 
  STATUE_PHOTOS_FOLDER_ID: "YOUR_PHOTOS_FOLDER_ID",
  BILL_PDFS_FOLDER_ID: "YOUR_PDFS_FOLDER_ID"
};
```

---

## 📌 STEP 5: Deploy Web App

1. In the Apps Script Editor, click **Deploy > New deployment**.
2. Click the gear icon **Select type** -> Choose **Web app**.
3. Fill in settings:
   - **Description**: `Ganpati Statue Booking Web App`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone`
4. Click **Deploy**.
5. Grant permissions when prompted by Google.
6. Copy the **Web App URL**!

🎉 **Congratulations!** Open the Web App URL on your phone, tablet, or PC to start booking statues and generating Marathi PDF bills!
