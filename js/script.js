/* ==========================================
   WISHLIST APP - MAIN SCRIPT
   ========================================== */

// Google Apps Script endpoint
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUeZ61uU0MbhsW45tEuMYD39pitDrVx-KbzxzzVCbihy2nfxpioI-eDkKbEf0CDlAv/exec";

// Status constant
const ACTIVE_STATUS = "Trong giỏ hàng";

// ==========================================
// DOM Elements
// ==========================================

const giftForm = document.getElementById("giftForm");
const giftsGrid = document.getElementById("giftsGrid");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // Load gifts on page startup
  loadAndDisplayGifts();

  // Handle form submission
  giftForm.addEventListener("submit", handleFormSubmit);
});

// ==========================================
// LOAD AND DISPLAY GIFTS
// ==========================================

async function loadAndDisplayGifts() {
  try {
    // Show loading state
    loadingState.style.display = "block";
    giftsGrid.innerHTML = "";
    emptyState.style.display = "none";

    // Fetch data from Google Sheets
    const gifts = await fetchGiftsFromSheet();

    // Filter to show only "Trong giỏ hàng" status
    const activeGifts = gifts.filter(gift => gift.status === ACTIVE_STATUS);

    // Hide loading state
    loadingState.style.display = "none";

    // Display gifts or empty state
    if (activeGifts.length === 0) {
      emptyState.style.display = "block";
    } else {
      displayGifts(activeGifts);
    }
  } catch (error) {
    console.error("Error loading gifts:", error);
    loadingState.style.display = "none";
    emptyState.style.display = "block";
    // Show helpful message for network issues
    const msg = error.message.includes("fetch") 
      ? "Không thể kết nối. Kiểm tra lại Google Apps Script đã được triển khai chưa?"
      : "Có lỗi khi tải danh sách. Vui lòng làm mới trang.";
    emptyState.querySelector(".empty-message").textContent = msg;
  }
}

// ==========================================
// FETCH GIFTS FROM GOOGLE SHEETS
// ==========================================

async function fetchGiftsFromSheet() {
  try {
    console.log("Fetching gifts from:", SCRIPT_URL + "?action=read");
    
    const response = await fetch(SCRIPT_URL + "?action=read", {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
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
        status: item.status || item["Status"] || ""
      }));
    }

    console.warn("Expected data format not found in response");
    return [];
  } catch (error) {
    console.error("Error fetching data:", error);
    console.log("Hint: Make sure Google Apps Script is deployed with 'Execute as: Me' and 'Who has access: Anyone'");
    return [];
  }
}

// ==========================================
// DISPLAY GIFTS IN GRID
// ==========================================

function displayGifts(gifts) {
  giftsGrid.innerHTML = "";

  gifts.forEach((gift, index) => {
    const giftCard = createGiftCard(gift, index);
    giftsGrid.appendChild(giftCard);
  });
}

// ==========================================
// CREATE GIFT CARD ELEMENT
// ==========================================

function createGiftCard(gift, index) {
  const col = document.createElement("div");
  col.className = "col-12 col-sm-6 col-lg-4";
  col.style.animationDelay = `${index * 0.1}s`;

  const card = document.createElement("div");
  card.className = "gift-card";

  // Gift name
  const nameEl = document.createElement("h3");
  nameEl.className = "gift-name";
  nameEl.textContent = gift.ten || "Không có tên";

  // Gift notes
  let notesEl = "";
  if (gift.ghichu && gift.ghichu.trim()) {
    const notes = document.createElement("p");
    notes.className = "gift-description";
    notes.textContent = gift.ghichu;
    notesEl = notes;
  }

  // Gift link
  let linkEl = "";
  if (gift.link && gift.link.trim()) {
    const linkContainer = document.createElement("div");
    linkContainer.className = "gift-link";

    const linkLabel = document.createElement("span");
    linkLabel.className = "gift-link-label";
    linkLabel.textContent = "Xem:";

    const link = document.createElement("a");
    link.href = normalizeUrl(gift.link);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = truncateUrl(gift.link);
    link.title = gift.link;

    linkContainer.appendChild(linkLabel);
    linkContainer.appendChild(link);
    linkEl = linkContainer;
  }

  // Assemble card
  card.appendChild(nameEl);
  if (notesEl) card.appendChild(notesEl);
  if (linkEl) card.appendChild(linkEl);

  col.appendChild(card);
  return col;
}

// ==========================================
// UTILITY FUNCTIONS - URL HANDLING
// ==========================================

function normalizeUrl(url) {
  if (!url) return "#";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

function truncateUrl(url) {
  if (!url) return "Link";
  // Remove protocol
  let display = url.replace(/^https?:\/\/(www\.)?/, "");
  // Truncate if too long
  if (display.length > 40) {
    display = display.substring(0, 37) + "...";
  }
  return display;
}

// ==========================================
// HANDLE FORM SUBMISSION
// ==========================================

async function handleFormSubmit(e) {
  e.preventDefault();

  // Get form values
  const ten = document.getElementById("ten").value.trim();
  const link = document.getElementById("link").value.trim();
  const ghichu = document.getElementById("ghichu").value.trim();

  // Validate
  if (!ten) {
    alert("Vui lòng nhập tên");
    return;
  }

  // Show loading state on button
  const submitBtn = giftForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang lưu...";

  try {
    // Prepare data with auto-set status
    const data = {
      action: "write",
      ten: ten,
      link: link,
      ghichu: ghichu,
      status: ACTIVE_STATUS // Auto-set to "Trong giỏ hàng"
    };

    // Send to Google Sheets
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.status === "success" || result.success) {
      // Success! Show message
      alert("✓ Đã lưu món quà thành công!");

      // Reset form
      giftForm.reset();

      // Reload and display gifts
      await loadAndDisplayGifts();
    } else {
      throw new Error(result.message || "Unknown error");
    }
  } catch (error) {
    console.error("Error submitting gift:", error);
    alert("✗ Có lỗi khi lưu. Vui lòng thử lại.\n\nLỗi: " + error.message);
  } finally {
    // Restore button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ==========================================
// AUTO-LOAD ON READY
// ========================================== 

console.log("Wishlist app script loaded successfully");
