/* ==========================================
   GOOGLE APPS SCRIPT - SETUP GUIDE
   For Vietnamese Wishlist Website
   ========================================== */

/*
IMPORTANT: Your Google Apps Script needs to be updated to support reading data
from the Google Sheet. The website needs to fetch existing gifts on page load.

REQUIRED FUNCTIONALITY:

1. WRITE ACTION (Already working)
   - Receives: { action: "write", ten, link, ghichu, status }
   - Saves to Google Sheet
   - Status should be set to "Trong giỏ hàng" for new gifts

2. READ ACTION (Needs to be added)
   - Receives: action=read (as URL parameter)
   - Returns all gifts from Google Sheet
   - Format: { data: [ { ten, link, ghichu, status }, ... ] }
   - Should include all rows with all statuses

GOOGLE SHEET STRUCTURE:
Column A: "Tên"
Column B: "Link"
Column C: "Ghi chú"
Column D: "Status"

GOOGLE APPS SCRIPT CODE EXAMPLE:

---

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  if (data.action === "write") {
    // Add new row to sheet
    sheet.appendRow([
      data.ten || "",
      data.link || "",
      data.ghichu || "",
      data.status || "Trong giỏ hàng"
    ]);
    
    return ContentService.createTextOutput(
      JSON.stringify({ status: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ status: "error", message: "Invalid action" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  if (e.parameter.action === "read") {
    // Skip header row and convert to JSON
    const gifts = data.slice(1).map(row => ({
      ten: row[0] || "",
      link: row[1] || "",
      ghichu: row[2] || "",
      status: row[3] || ""
    }));

    return ContentService.createTextOutput(
      JSON.stringify({ data: gifts })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: "error" })
  ).setMimeType(ContentService.MimeType.JSON);
}

---

DEPLOYMENT:
1. Update your Google Apps Script with the code above (or similar)
2. Keep the same deployment URL
3. Test the /exec?action=read endpoint in browser to verify it returns JSON
4. Website will automatically fetch and display gifts

TROUBLESHOOTING:
- If gifts don't appear on page load, check browser console (F12) for errors
- Verify Google Apps Script returns proper JSON format
- Make sure Google Sheet column names match exactly
- Check that "Status" dropdown values are spelled correctly: "Trong giỏ hàng" and "Đã mua"
*/
