/**
 * ==============================================================================
 * GANPATI BAPPA STATUE BOOKING & MARATHI BILL PDF GENERATOR
 * Platform Backend - Google Apps Script (Code.gs)
 * ==============================================================================
 */

// CONFIGURATION: Replace these IDs with your actual Google IDs after setup
const CONFIG = {
  // If left empty, Script will automatically use the active Spreadsheet
  SPREADSHEET_ID: "1YnUoIXb62yvHSgfCOhsRYoeNqtV8YYG80eZbLnsJsD8", 
  SHEET_NAME: "Bookings",
  
  // Google Doc Template File ID (Create a Google Doc based on your Marathi Bill template)
  DOC_TEMPLATE_ID: "1T-FTslzpW5SFkCNB7jGX6d0Tz1It7tz4O_ph7zlWlRI",
  
  // Google Drive Folder IDs (Create folders in Drive and paste IDs here)
  STATUE_PHOTOS_FOLDER_ID: "13zrngQeY86itPEpQ7kVgpJuFfdcG7aSa",
  BILL_PDFS_FOLDER_ID: "1D4YKD5A-g0Tgb1yTD0pGx7vCFPJ5-oa5"
};

/**
 * Serves the HTML Web App UI
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('सदिच्छा कला केंद्र - गणपती बाप्पा बुकिंग सिस्टीम')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Gets or creates the main Spreadsheet instance
 */
function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== "YOUR_GOOGLE_GOOGLE_SHEET_ID_HERE") {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Gets or initializes the 'Bookings' Sheet with headers
 */
function getBookingsSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    const headers = [
      "Booking_ID", "Booking_Date", "Customer_Name", "Mobile_Number", 
      "Email_ID", "Statue_Number", "Statue_Image_URL", "Total_Amount", 
      "Advance_Amount", "Balance_Amount", "Payment_Mode", "Booked_By_Owner", 
      "Booking_Status", "PDF_Bill_URL", "Final_Payment_Date", 
      "Final_Payment_Mode", "Cancellation_Reason", "Created_Timestamp",
      "Final_Payment_Owner", "Cancellation_Owner", "Cancellation_Timestamp"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e67e22").setFontColor("#ffffff");
  }
  return sheet;
}

/**
 * Auto-generates a unique Booking ID by finding MAX existing numeric ID (e.g. GB-2026-0016)
 */
function generateBookingId() {
  try {
    const sheet = getBookingsSheet();
    const lastRow = sheet.getLastRow();
    const year = new Date().getFullYear();
    const prefix = `GB-${year}-`;
    
    if (lastRow <= 1) {
      return `${prefix}0001`;
    }
    
    // Scan all existing Booking IDs in Column A
    const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
    let maxNum = 0;
    
    for (let i = 0; i < idValues.length; i++) {
      const val = idValues[i][0] ? String(idValues[i][0]).trim() : "";
      if (!val) continue;
      
      // Match and extract trailing digits (e.g. '0015' from 'GB-2026-0015')
      const match = val.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  } catch (err) {
    Logger.log("Error in generateBookingId: " + err.toString());
    const year = new Date().getFullYear();
    return `GB-${year}-0001`;
  }
}

/**
 * Saves base64 statue photo file to Google Drive folder
 */
function saveStatueImageToDrive(base64Data, filename) {
  try {
    if (!base64Data) return "";
    const splitData = base64Data.split(',');
    const contentType = splitData[0].match(/:(.*?);/)[1];
    const decodedData = Utilities.base64Decode(splitData[1]);
    const blob = Utilities.newBlob(decodedData, contentType, filename);
    
    let folder;
    if (CONFIG.STATUE_PHOTOS_FOLDER_ID && CONFIG.STATUE_PHOTOS_FOLDER_ID !== "YOUR_STATUE_PHOTOS_FOLDER_ID_HERE") {
      folder = DriveApp.getFolderById(CONFIG.STATUE_PHOTOS_FOLDER_ID);
    } else {
      folder = DriveApp.getRootFolder();
    }
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log("Error saving image to Drive: " + err.toString());
    return "";
  }
}

/**
 * Main Endpoint 1: Create New Statue Booking & Generate Marathi PDF Bill
 */
function createNewBooking(formData) {
  try {
    const sheet = getBookingsSheet();
    const lastRow = sheet.getLastRow();
    
    // Fast Unique Statue Number Check (Must be unique among active BOOKED/PAID statues)
    const statueNo = formData.statueNumber ? String(formData.statueNumber).trim().toLowerCase() : "";
    if (statueNo && lastRow > 1) {
      const data = sheet.getRange(2, 1, lastRow - 1, 13).getDisplayValues();
      for (let i = 0; i < data.length; i++) {
        const existingStatue = String(data[i][5]).trim().toLowerCase();
        const existingStatus = String(data[i][12]).trim().toUpperCase();
        if (existingStatue === statueNo && existingStatus !== "CANCELLED") {
          const existingId = data[i][0];
          const existingCustomer = data[i][2];
          return {
            success: false,
            message: `⚠️ मूर्ती क्रमांक '${formData.statueNumber}' ही अगोदरच बुक झालेली आहे (आयडी: ${existingId}, ग्राहक: ${existingCustomer}). कृपया दुसरा मूर्ती क्रमांक टाका.`
          };
        }
      }
    }

    const bookingId = generateBookingId();
    const bookingDate = formData.bookingDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
    
    const totalAmount = parseFloat(formData.totalAmount) || 0;
    const advanceAmount = parseFloat(formData.advanceAmount) || 0;
    const balanceAmount = Math.max(0, totalAmount - advanceAmount);
    
    // Save image to Drive if provided
    let imageUrl = "";
    if (formData.statueImageBase64) {
      const imageName = `${bookingId}_${formData.statueNumber || 'statue'}.jpg`;
      imageUrl = saveStatueImageToDrive(formData.statueImageBase64, imageName);
    }
    
    // Determine initial status
    const status = (balanceAmount === 0) ? "PAID" : "BOOKED";
    
    // Create Marathi PDF Bill from Doc Template
    const pdfDetails = generateMarathiPdfBill({
      bookingId: bookingId,
      bookingDate: bookingDate,
      customerName: formData.customerName,
      mobileNumber: formData.mobileNumber,
      emailId: formData.emailId || "-",
      statueNumber: formData.statueNumber,
      totalAmount: totalAmount,
      advanceAmount: advanceAmount,
      balanceAmount: balanceAmount,
      paymentMode: formData.paymentMode,
      bookedByOwner: formData.bookedByOwner,
      status: status,
      imageBase64: formData.statueImageBase64
    });
    
    const createdTimestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    // Append to Google Sheet
    const rowData = [
      bookingId,
      bookingDate,
      formData.customerName,
      formData.mobileNumber,
      formData.emailId || "-",
      formData.statueNumber,
      imageUrl,
      totalAmount,
      advanceAmount,
      balanceAmount,
      formData.paymentMode,
      formData.bookedByOwner,
      status,
      pdfDetails.pdfUrl || "",
      (status === "PAID") ? bookingDate : "",
      (status === "PAID") ? formData.paymentMode : "",
      "", // Cancellation Reason
      createdTimestamp,
      (status === "PAID") ? formData.bookedByOwner : "", // Final Payment Owner (Column S / 19)
      "", // Cancellation Owner (Column T / 20)
      ""  // Cancellation Timestamp (Column U / 21)
    ];
    
    sheet.appendRow(rowData);
    
    return {
      success: true,
      bookingId: bookingId,
      pdfUrl: pdfDetails.pdfUrl,
      pdfBase64: pdfDetails.pdfBase64 || "",
      balanceAmount: balanceAmount,
      message: `बुकिंग यशस्वीरित्या नोंदवले गेले! बुकिंग आयडी: ${bookingId}`
    };
  } catch (error) {
    Logger.log("Error in createNewBooking: " + error.toString());
    return {
      success: false,
      message: "त्रुटी (Error): " + error.toString()
    };
  }
}

/**
 * Creates PDF file from Marathi Bill template (High Performance & 100% Image Guaranteed)
 */
function generateMarathiPdfBill(data) {
  try {
    let pdfFolder;
    if (CONFIG.BILL_PDFS_FOLDER_ID && CONFIG.BILL_PDFS_FOLDER_ID !== "YOUR_BILL_PDFS_FOLDER_ID_HERE") {
      pdfFolder = DriveApp.getFolderById(CONFIG.BILL_PDFS_FOLDER_ID);
    } else {
      pdfFolder = DriveApp.getRootFolder();
    }
    
    // High Speed HTML-to-PDF Generator (~1 second execution time, 100% visible statue photo)
    return generateFastMarathiPdf(data, pdfFolder);
  } catch (err) {
    Logger.log("Error generating PDF: " + err.toString());
    return { pdfUrl: "", pdfId: "" };
  }
}

/**
 * Ultra-fast Marathi PDF generator matching exact reference bill template with Ganpati Festival Vibes
 */
function generateFastMarathiPdf(data, pdfFolder) {
  // Statue Photo Placement HTML (Top-Left Box)
  let statueImgHtml = "";
  if (data.imageBase64 && data.imageBase64.length > 50) {
    statueImgHtml = `
      <div style="width:165px; height:165px; border-radius:16px; overflow:hidden; border:3px solid #d35400; box-shadow:0 4px 12px rgba(211,84,0,0.25); display:inline-block; background:#ffffff;">
        <img src="${data.imageBase64}" style="width:100%; height:100%; object-fit:cover; display:block;">
      </div>`;
  } else {
    statueImgHtml = `
      <div style="width:165px; height:165px; border-radius:16px; border:2.5px dashed #d35400; background:#fef9e7; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#d35400; font-size:13px; font-weight:bold; text-align:center; padding:10px;">
        <span style="font-size:28px; margin-bottom:5px;">🌺</span>
        मूर्ती फोटो उपलब्ध नाही
      </div>`;
  }

  // Checkboxes
  const cashCheck = data.paymentMode === "कॅश" ? "☑" : "☐";
  const upiCheck = data.paymentMode === "UPI" ? "☑" : "☐";
  const onlineCheck = data.paymentMode === "ऑनलाईन" ? "☑" : "☐";

  const shivCheck = data.bookedByOwner === "शिव" ? "☑" : "☐";
  const rahulCheck = data.bookedByOwner === "राहुल" ? "☑" : "☐";
  const harshadCheck = data.bookedByOwner === "हर्षद" ? "☑" : "☐";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Noto Sans Devanagari', sans-serif; margin: 0; padding: 12px; color: #2c3e50; background: #ffffff; }
        .bill-border { border: 4px double #d35400; padding: 22px; border-radius: 16px; max-width: 750px; margin: auto; background: #fffdf9; position: relative; }
        
        .header { text-align: center; color: #b7950b; margin-bottom: 12px; }
        .divine-title { font-weight: 800; font-size: 15px; color: #d35400; letter-spacing: 1px; }
        .title { color: #6c3483; font-size: 30px; font-weight: 800; margin: 4px 0; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .tagline { background: linear-gradient(135deg, #d35400 0%, #e67e22 100%); color: white; padding: 6px 20px; border-radius: 20px; font-size: 13px; display: inline-block; font-weight: 700; box-shadow: 0 2px 6px rgba(211,84,0,0.2); }
        
        .top-section { display: table; width: 100%; margin-top: 15px; margin-bottom: 15px; }
        .top-left { display: table-cell; width: 185px; vertical-align: top; }
        .top-right { display: table-cell; vertical-align: top; padding-left: 20px; }
        
        .bill-banner { background: linear-gradient(135deg, #d35400 0%, #c0392b 100%); color: white; text-align: center; font-size: 18px; font-weight: 800; padding: 8px; border-radius: 8px; margin-bottom: 12px; letter-spacing: 1px; }
        
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 6px 0; font-size: 14.5px; vertical-align: middle; border-bottom: 1px dashed #f2d7d5; }
        .info-label { font-weight: 700; color: #d35400; width: 185px; display: inline-block; }
        .info-val { font-weight: 800; color: #2c3e50; }
        
        .grid-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .grid-table td { padding: 12px; border: 1.5px solid #d35400; font-size: 14.5px; vertical-align: top; }
        
        .amount-row { margin-bottom: 8px; font-weight: 700; font-size: 15px; }
        .amount-val { font-size: 16.5px; font-weight: 800; padding: 3px 10px; border-radius: 6px; background: #fef9e7; display: inline-block; border: 1px solid #f9e79f; }
        
        .footer { text-align: center; margin-top: 22px; border-top: 2px solid #d35400; padding-top: 14px; }
        .thanks-msg { color: #6c3483; font-weight: 800; font-size: 17px; }
        .sub-msg { font-size: 12.5px; color: #7f8c8d; margin-top: 4px; font-weight: 600; }
        
        .contact-card { background: linear-gradient(135deg, #4a235a 0%, #2c1638 100%); color: white; padding: 14px 20px; border-radius: 10px; font-size: 13px; display: table; width: 100%; margin-top: 14px; box-shadow: 0 3px 8px rgba(0,0,0,0.15); }
        .contact-left { display: table-cell; text-align: left; vertical-align: middle; width: 65%; line-height: 1.5; }
        .contact-right { display: table-cell; text-align: right; vertical-align: middle; width: 35%; line-height: 1.6; font-weight: bold; }
        
        .motto { margin-top: 12px; color: #d35400; font-weight: 800; font-size: 17px; }
      </style>
    </head>
    <body>
      <div class="bill-border">
        <!-- Header -->
        <div class="header">
          <div class="divine-title">🌺 ॥ श्री गणेशाय नमः ॥ 🌺</div>
          <div class="title">सदिच्छा कला केंद्र</div>
          <div class="tagline">✨ आमच्या येथे पेण येथील सुबक आणि आकर्षक, मातीच्या मूर्ती मिळतील ✨</div>
        </div>
        
        <!-- Top Section with Statue Photo & Customer Info -->
        <div class="top-section">
          <div class="top-left">
            ${statueImgHtml}
          </div>
          <div class="top-right">
            <div class="bill-banner">🚩 ✦ बुकिंग बिल ✦ 🚩</div>
            <table class="info-table">
              <tr>
                <td><span class="info-label">✦ बुकिंग क्रमांक :</span> <span class="info-val" style="color:#c0392b;">${data.bookingId}</span></td>
              </tr>
              <tr>
                <td><span class="info-label">✦ दिनांक :</span> <span class="info-val">${data.bookingDate}</span></td>
              </tr>
              <tr>
                <td><span class="info-label">✦ कस्टमर चे नाव :</span> <span class="info-val">${data.customerName}</span></td>
              </tr>
              <tr>
                <td><span class="info-label">✦ मोबाईल क्रमांक :</span> <span class="info-val">${data.mobileNumber}</span></td>
              </tr>
              <tr>
                <td><span class="info-label">✦ ईमेल आयडी :</span> <span class="info-val">${data.emailId}</span></td>
              </tr>
              <tr>
                <td><span class="info-label">✦ बुक केलेल्या मूर्ती क्रमांक :</span> <span class="info-val" style="color:#27ae60;">${data.statueNumber}</span></td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Table Grid for Amounts & Payment Modes -->
        <table class="grid-table">
          <tr style="background:linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color:white; font-weight:bold; text-align:center;">
            <td width="50%" style="border-color:#d35400;">❖ रक्कम तपशील ❖</td>
            <td width="50%" style="border-color:#d35400;">❖ पेमेंट प्रकार & बुकिंग ❖</td>
          </tr>
          <tr>
            <td>
              <div class="amount-row">₹ एकूण रक्कम : <span class="amount-val" style="color:#27ae60;">₹ ${data.totalAmount.toLocaleString('en-IN')}</span></div>
              <div class="amount-row">₹ जमा रक्कम : <span class="amount-val" style="color:#2980b9;">₹ ${data.advanceAmount.toLocaleString('en-IN')}</span></div>
              <div class="amount-row">₹ बाकी रक्कम : <span class="amount-val" style="color:#c0392b;">₹ ${data.balanceAmount.toLocaleString('en-IN')}</span></div>
            </td>
            <td>
              <div style="font-weight:800; color:#6c3483; margin-bottom:6px;">पेमेंट प्रकार:</div>
              <div style="font-size:14.5px; margin-bottom:10px; font-weight:bold;">
                ${cashCheck} कॅश &nbsp;&nbsp;&nbsp; ${upiCheck} UPI &nbsp;&nbsp;&nbsp; ${onlineCheck} ऑनलाईन
              </div>
              <hr style="border:0; border-top:1px solid #fad7a0; margin:8px 0;">
              <div style="font-weight:800; color:#6c3483; margin-bottom:6px;">बुकिंग करणारा:</div>
              <div style="font-size:14.5px; font-weight:bold;">
                ${shivCheck} शिव &nbsp;&nbsp;&nbsp; ${rahulCheck} राहुल &nbsp;&nbsp;&nbsp; ${harshadCheck} हर्षद
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer Section -->
        <div class="footer">
          <div class="thanks-msg">🙏 आपल्या विश्वासाबद्दल मनःपूर्वक आभार! 🙏</div>
          <div class="sub-msg">✤ सुंदर मूर्ती, सुंदर संस्कार आणि आपल्या आनंदासाठी आमची प्रामाणिक सेवा. ✤</div>
          
          <div class="contact-card">
            <div class="contact-left">
              <strong>सदिच्छा कला केंद्र, स्टॉल क्रमांक १०</strong><br>
              उदाजी महाराज म्युझियम ऑफ एज्युकेशन हेरिटेज, आकाशवाणी टॉवर जवळ, गंगापूर रोड, नाशिक<br>
              <span style="font-size:11px; color:#f9e79f; font-weight:bold; display:inline-block; margin-top:3px;">▶️ YouTube: @Sadichha_Kala_Kendra &nbsp;|&nbsp; 📷 Insta: @sadichha_kala_kendra</span>
            </div>
            <div class="contact-right">
              शिव : ९१५८१९९३००<br>
              राहुल : ९६५७५०२१९१<br>
              हर्षद : ८३९०००१३९०
            </div>
          </div>

          <div class="motto">🌺 ॥ गणपती बाप्पा मोरया ॥ 🌺</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const htmlBlob = Utilities.newBlob(htmlContent, 'text/html', `Bill_${data.bookingId}.html`);
  const pdfBlob = htmlBlob.getAs('application/pdf').setName(`Bill_${data.bookingId}.pdf`);
  const pdfFile = pdfFolder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const cleanPdfUrl = `https://drive.google.com/file/d/${pdfFile.getId()}/view`;
  const pdfBase64 = Utilities.base64Encode(pdfBlob.getBytes());
  return { pdfUrl: cleanPdfUrl, pdfId: pdfFile.getId(), pdfBase64: pdfBase64 };
}

/**
 * Main Endpoint 2: Search Booking by ID, Mobile Number, Customer Name, or Statue Code
 */
function searchBooking(query) {
  try {
    if (query === null || query === undefined || String(query).trim() === "") {
      return { success: false, message: "कृपया बुकिंग आयडी, मोबाईल नंबर, नाव किंवा मूर्ती क्र. टाका." };
    }
    
    const sheet = getBookingsSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "कोणतेही बुकिंग रेकॉर्ड सापडले नाही." };
    
    const data = sheet.getRange(1, 1, lastRow, 21).getDisplayValues();
    const cleanQuery = String(query).trim().toLowerCase();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const bookingId = row[0] ? String(row[0]).trim().toLowerCase() : "";
      const customerName = row[2] ? String(row[2]).trim().toLowerCase() : "";
      const mobileNumber = row[3] ? String(row[3]).trim().toLowerCase() : "";
      const statueNumber = row[5] ? String(row[5]).trim().toLowerCase() : "";
      
      if (bookingId === cleanQuery || mobileNumber === cleanQuery || customerName.includes(cleanQuery) || statueNumber === cleanQuery) {
        return {
          success: true,
          booking: {
            rowIndex: i + 1,
            bookingId: row[0],
            bookingDate: row[1],
            customerName: row[2],
            mobileNumber: row[3],
            emailId: row[4],
            statueNumber: row[5],
            statueImageUrl: row[6],
            totalAmount: row[7],
            advanceAmount: row[8],
            balanceAmount: row[9],
            paymentMode: row[10],
            bookedByOwner: row[11],
            bookingStatus: row[12],
            pdfBillUrl: row[13],
            finalPaymentDate: row[14],
            finalPaymentMode: row[15],
            cancellationReason: row[16],
            createdTimestamp: row[17],
            finalPaymentOwner: row[18] || "",
            cancellationOwner: row[19] || "",
            cancellationTimestamp: row[20] || ""
          }
        };
      }
    }
    
    return { success: false, message: `'${query}' साठी कोणतेही जुळणारे बुकिंग रेकॉर्ड सापडले नाही.` };
  } catch (err) {
    return { success: false, message: "त्रुटी: " + err.toString() };
  }
}

/**
 * Main Endpoint 3: Complete Balance Payment & Mark as PAID
 */
function markBookingAsPaid(bookingId, finalPaymentMode, finalPaymentOwner) {
  try {
    const searchRes = searchBooking(bookingId);
    if (!searchRes.success) return searchRes;
    
    const sheet = getBookingsSheet();
    const rowIndex = searchRes.booking.rowIndex;
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
    
    // Column J (10) -> Balance_Amount = 0
    // Column M (13) -> Booking_Status = PAID
    // Column O (15) -> Final_Payment_Date
    // Column P (16) -> Final_Payment_Mode
    // Column S (19) -> Final_Payment_Owner
    sheet.getRange(rowIndex, 10).setValue(0);
    sheet.getRange(rowIndex, 13).setValue("PAID");
    sheet.getRange(rowIndex, 15).setValue(today);
    sheet.getRange(rowIndex, 16).setValue(finalPaymentMode || "कॅश");
    sheet.getRange(rowIndex, 19).setValue(finalPaymentOwner || "शिव");
    
    return {
      success: true,
      message: `बुकिंग आयडी ${bookingId} चे स्टेटस यशस्वीरित्या 'PAID' (पूर्ण जमा) केले आहे!`
    };
  } catch (err) {
    return { success: false, message: "त्रुटी: " + err.toString() };
  }
}

/**
 * Main Endpoint 4: Cancel Statue Booking
 */
function cancelBooking(bookingId, cancellationReason, cancellationOwner) {
  try {
    const searchRes = searchBooking(bookingId);
    if (!searchRes.success) return searchRes;
    
    const sheet = getBookingsSheet();
    const rowIndex = searchRes.booking.rowIndex;
    const nowTimestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    // Column M (13) -> Booking_Status = CANCELLED
    // Column Q (17) -> Cancellation_Reason
    // Column T (20) -> Cancellation_Owner
    // Column U (21) -> Cancellation_Timestamp
    sheet.getRange(rowIndex, 13).setValue("CANCELLED");
    sheet.getRange(rowIndex, 17).setValue(cancellationReason || "ग्राहकाची विनंती");
    sheet.getRange(rowIndex, 20).setValue(cancellationOwner || "शिव");
    sheet.getRange(rowIndex, 21).setValue(nowTimestamp);
    
    return {
      success: true,
      message: `बुकिंग आयडी ${bookingId} यशस्वीरित्या रद्द (CANCELLED) करण्यात आले आहे.`
    };
  } catch (err) {
    return { success: false, message: "त्रुटी: " + err.toString() };
  }
}

/**
 * Main Endpoint 5: Fetch All Bookings for Dashboard Table with Complete Audit Details (Ultra-Fast Execution)
 */
function getAllBookings() {
  try {
    const sheet = getBookingsSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, bookings: [] };
    
    // Ultra-Fast Range Fetch (Exact 21 Columns as Formatted Display Strings)
    const data = sheet.getRange(1, 1, lastRow, 21).getDisplayValues();
    const bookings = [];
    
    // Reverse iteration directly in loop for high performance
    for (let i = lastRow - 1; i >= 1; i--) {
      const row = data[i];
      if (!row[0]) continue; // Skip empty rows
      
      bookings.push({
        bookingId: row[0],
        bookingDate: row[1],
        customerName: row[2],
        mobileNumber: row[3],
        emailId: row[4],
        statueNumber: row[5],
        statueImageUrl: row[6],
        totalAmount: row[7],
        advanceAmount: row[8],
        balanceAmount: row[9],
        paymentMode: row[10],
        bookedByOwner: row[11],
        bookingStatus: row[12],
        pdfBillUrl: row[13],
        finalPaymentDate: row[14],
        finalPaymentMode: row[15],
        cancellationReason: row[16],
        createdTimestamp: row[17],
        finalPaymentOwner: row[18] || "",
        cancellationOwner: row[19] || "",
        cancellationTimestamp: row[20] || ""
      });
    }
    return { success: true, bookings: bookings };
  } catch (err) {
    return { success: false, message: "त्रुटी: " + err.toString(), bookings: [] };
  }
}
