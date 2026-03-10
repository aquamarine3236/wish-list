/* ==========================================
   API — Google Sheets read/write/update/delete
   ========================================== */

async function fetchGiftsFromSheet() {
  try {
    console.log("Fetching gifts from:", SCRIPT_URL + "?action=read");

    const response = await fetch(SCRIPT_URL + "?action=read&t=" + Date.now());

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response error:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Fetched data:", result);

    // Transform server response to match our expected format
    // Expected format: array of objects with { ten, link, ghichu, status }
    if (result.data && Array.isArray(result.data)) {
      return result.data.map(item => ({
        ten: item.ten || item["Tên"] || "",
        link: item.link || item["Link"] || "",
        ghichu: item.ghichu || item["Ghi chú"] || "",
        doMongMuon: item.doMongMuon || item["Độ mong muốn"] || item["do_mong_muon"] || "",
        status: item.status || item["Status"] || ""
      }));
    }

    console.warn("Expected data format not found in response");
    return [];
  } catch (error) {
    console.error("Error fetching data:", error);
    console.log("Hint: Make sure Google Apps Script is deployed with 'Execute as: Me' and 'Who has access: Anyone'");
    throw error;
  }
}

async function saveGiftToSheet(data) {
  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });
  return await response.json();
}
