/* ==========================================
   WISHLIST APP - MAIN SCRIPT
   ========================================== */

// Google Apps Script endpoint
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbweDQXLC63qo6AUjTGJT6U2Xa-vEkQcR-qLTXeodq1id1U5if-Xg3OVRvX4V_suvMU/exec";

// Status constant
const ACTIVE_STATUS = "Trong giỏ hàng";

// ==========================================
// DOM Elements
// ==========================================

const giftForm = document.getElementById("giftForm");
const giftsGrid = document.getElementById("giftsGrid");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");

// Table DOM elements
const giftsTableBody = document.getElementById("giftsTableBody");
const tableLoadingState = document.getElementById("tableLoadingState");
const tableEmptyState = document.getElementById("tableEmptyState");
const tableWrapper = document.getElementById("tableWrapper");
const tableTab = document.getElementById("table-tab");

// Tab elements
const giftTabs = document.getElementById("giftTabs");
let tableDataLoaded = false;

// ==========================================
// STAR PICKER
// ==========================================

const STAR_LABELS = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

function setStarPicker(pickerId, inputId, value) {
  const picker = document.getElementById(pickerId);
  if (!picker) return;
  picker.querySelectorAll(".star-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.value) <= value);
  });
  document.getElementById(inputId).value = value || "";

  // Update count label
  const wrapper = picker.closest(".star-picker-wrapper");
  if (wrapper) {
    const label = wrapper.querySelector(".star-count-label");
    if (label) {
      label.textContent = value ? STAR_LABELS[value] : "";
      label.classList.toggle("visible", value > 0);
    }
    if (value > 0) {
      wrapper.classList.remove("error");
      const errMsg = wrapper.parentElement?.querySelector(".star-required-msg");
      if (errMsg) errMsg.classList.remove("visible");
    }
  }
}

function initStarPicker(pickerId, inputId) {
  const picker = document.getElementById(pickerId);
  if (!picker) return;
  const btns = picker.querySelectorAll(".star-btn");

  btns.forEach(btn => {
    btn.addEventListener("mouseenter", () => {
      const hov = parseInt(btn.dataset.value);
      btns.forEach(b => b.classList.toggle("active", parseInt(b.dataset.value) <= hov));
    });
    btn.addEventListener("mouseleave", () => {
      const sel = parseInt(document.getElementById(inputId).value) || 0;
      btns.forEach(b => b.classList.toggle("active", parseInt(b.dataset.value) <= sel));
    });
    btn.addEventListener("click", () => {
      setStarPicker(pickerId, inputId, parseInt(btn.dataset.value));
    });
  });
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // Handle form submission
  giftForm.addEventListener("submit", handleFormSubmit);

  // Handle tab switching
  tableTab.addEventListener("shown.bs.tab", (e) => {
    if (!tableDataLoaded) {
      loadAndDisplayGiftsInTable();
      tableDataLoaded = true;
    }
  });

  // Close any open action menus when clicking outside
  document.addEventListener("click", closeAllActionMenus);

  // Init star pickers
  initStarPicker("starPicker", "doMongMuon");
  initStarPicker("editStarPicker", "editDoMongMuon");
});

// ==========================================
// LOAD AND DISPLAY GIFTS IN TABLE
// ==========================================

function showTableLoading() {
  tableLoadingState.style.display = "flex";
  tableWrapper.style.display = "none";
  tableEmptyState.style.display = "none";
  giftsTableBody.innerHTML = "";
}

async function loadAndDisplayGiftsInTable() {
  try {
    // Show loading state
    tableLoadingState.style.display = "flex";
    giftsTableBody.innerHTML = "";
    tableEmptyState.style.display = "none";
    tableWrapper.style.display = "none";

    // Fetch data from Google Sheets
    const gifts = await fetchGiftsFromSheet();

    // Filter to show only "Trong giỏ hàng" status
    const activeGifts = gifts.filter(gift => gift.status === ACTIVE_STATUS);

    // Hide loading state
    tableLoadingState.style.display = "none";

    // Display gifts or empty state
    if (activeGifts.length === 0) {
      tableEmptyState.style.display = "block";
    } else {
      displayGiftsInTable(activeGifts);
      tableWrapper.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading gifts:", error);
    tableLoadingState.style.display = "none";
    tableEmptyState.style.display = "block";
    // Show helpful message for network issues
    const msg = error.message.includes("fetch") 
      ? "Không thể kết nối. Kiểm tra lại Google Apps Script đã được triển khai chưa?"
      : "Có lỗi khi tải danh sách. Vui lòng làm mới trang.";
    tableEmptyState.querySelector(".empty-message").textContent = msg;
  }
}

// ==========================================
// FETCH GIFTS FROM GOOGLE SHEETS
// ==========================================

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

// ==========================================
// DISPLAY GIFTS IN TABLE
// ==========================================

function displayGiftsInTable(gifts) {
  // Remove any previously appended action menus from body
  document.querySelectorAll("body > .action-menu").forEach(m => m.remove());
  giftsTableBody.innerHTML = "";

  gifts.forEach((gift, index) => {
    const row = createTableRow(gift, index);
    giftsTableBody.appendChild(row);
  });
}

// ==========================================
// CREATE TABLE ROW
// ==========================================

function createTableRow(gift, index) {
  const row = document.createElement("tr");
  row.dataset.giftName = gift.ten;

  // Helper to wrap value in a span for mobile flex layout
  const valueSpan = (content) => {
    const span = document.createElement("span");
    span.className = "cell-value";
    if (typeof content === "string") {
      span.textContent = content;
    } else {
      span.appendChild(content);
    }
    return span;
  };

  // Name Cell
  const nameCell = document.createElement("td");
  nameCell.className = "cell-name";
  nameCell.dataset.label = "Tên";
  nameCell.appendChild(valueSpan(gift.ten || "Không có tên"));

  // Link Cell
  const linkCell = document.createElement("td");
  linkCell.className = "cell-link";
  linkCell.dataset.label = "Link";
  if (gift.link && gift.link.trim()) {
    const link = document.createElement("a");
    link.href = normalizeUrl(gift.link);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Link";
    link.title = gift.link;
    linkCell.appendChild(valueSpan(link));
  } else {
    linkCell.appendChild(valueSpan("—"));
  }

  // Stars Cell
  const starsCell = document.createElement("td");
  starsCell.className = "cell-stars";
  starsCell.dataset.label = "Mong muốn";
  const level = parseInt(gift.doMongMuon) || 0;
  if (level > 0) {
    const starsDiv = document.createElement("div");
    starsDiv.className = "cell-stars-display";
    for (let i = 0; i < level; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.textContent = "★";
      starsDiv.appendChild(star);
    }
    starsCell.appendChild(valueSpan(starsDiv));
  } else {
    starsCell.appendChild(valueSpan("—"));
  }

  // Note Cell
  const noteCell = document.createElement("td");
  noteCell.className = "cell-note";
  noteCell.dataset.label = "Ghi chú";
  noteCell.appendChild(valueSpan(gift.ghichu || "—"));

  // Actions Cell
  const actionsCell = document.createElement("td");
  actionsCell.className = "cell-actions";
  actionsCell.dataset.label = "";
  const actionMenu = createActionMenu(gift);
  actionsCell.appendChild(valueSpan(actionMenu));

  row.appendChild(nameCell);
  row.appendChild(linkCell);
  row.appendChild(starsCell);
  row.appendChild(noteCell);
  row.appendChild(actionsCell);

  return row;
}

// ==========================================
// CREATE ACTION MENU
// ==========================================

function createActionMenu(gift) {
  const container = document.createElement("div");
  container.className = "action-menu-container";
  container.style.position = "relative";

  const btn = document.createElement("button");
  btn.className = "action-menu-btn";
  btn.innerHTML = "⋯";
  btn.type = "button";

  const menu = document.createElement("div");
  menu.className = "action-menu";
  // Attach menu to body so it escapes all overflow/clip containers
  document.body.appendChild(menu);

  // Edit Button
  const editBtn = document.createElement("button");
  editBtn.className = "action-menu-item";
  editBtn.textContent = "Sửa";
  editBtn.type = "button";
  editBtn.addEventListener("click", () => {
    closeAllActionMenus();
    openEditModal(gift);
  });

  // Delete Button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "action-menu-item delete";
  deleteBtn.textContent = "Xóa";
  deleteBtn.type = "button";
  deleteBtn.addEventListener("click", () => {
    closeAllActionMenus();
    deleteRow(gift);
  });

  menu.appendChild(editBtn);
  menu.appendChild(deleteBtn);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllActionMenus();
    // Position menu using fixed coords so it escapes any overflow container
    const rect = btn.getBoundingClientRect();
    menu.style.top = (rect.bottom + 6) + "px";
    menu.style.left = (rect.right - 130) + "px";
    menu.classList.add("show");
  });

  container.appendChild(btn);

  return container;
}

function closeAllActionMenus() {
  document.querySelectorAll(".action-menu").forEach(menu => {
    menu.classList.remove("show");
  });
}

// ==========================================
// MODAL EDIT MODE
// ==========================================

function openEditModal(gift) {
  // Populate modal with current data
  document.getElementById("editTen").value = gift.ten;
  document.getElementById("editLink").value = gift.link || "";
  document.getElementById("editGhichu").value = gift.ghichu || "";

  // Populate star picker
  const level = parseInt(gift.doMongMuon) || 0;
  document.getElementById("editDoMongMuon").value = level || "";
  setStarPicker("editStarPicker", "editDoMongMuon", level);

  // Store current gift data for saving
  window.currentEditingGift = gift;

  // Show modal
  const editModal = new bootstrap.Modal(document.getElementById('editModal'));
  editModal.show();
}

// Initialize edit modal save button
document.addEventListener("DOMContentLoaded", () => {
  // Handle form submission
  giftForm.addEventListener("submit", handleFormSubmit);

  // Handle tab switching
  tableTab.addEventListener("shown.bs.tab", (e) => {
    if (!tableDataLoaded) {
      loadAndDisplayGiftsInTable();
      tableDataLoaded = true;
    }
  });

  // Close any open action menus when clicking outside
  document.addEventListener("click", closeAllActionMenus);

  // Handle edit modal save
  document.getElementById("saveEditBtn").addEventListener("click", async () => {
    const newLink = document.getElementById("editLink").value.trim();
    const newNote = document.getElementById("editGhichu").value.trim();
    const newDoMongMuon = document.getElementById("editDoMongMuon").value;
    const giftName = window.currentEditingGift?.ten || "";

    // Close modal first, then show confirm dialog
    const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    editModal.hide();

    const confirmed = await showConfirmDialog(
      `Bạn có chắc chắn muốn lưu thay đổi cho "<strong>${giftName}</strong>"?`,
      "Lưu thay đổi",
      "save"
    );
    if (!confirmed) return;

    showTableLoading();
    await saveRowEdit(window.currentEditingGift, newLink, newNote, newDoMongMuon);
  });

  // Handle reload button
  const reloadBtn = document.getElementById("reloadTableBtn");
  if (reloadBtn) {
    reloadBtn.addEventListener("click", async () => {
      reloadBtn.disabled = true;
      tableDataLoaded = false;
      await loadAndDisplayGiftsInTable();
      tableDataLoaded = true;
      reloadBtn.disabled = false;
    });
  }
});

async function saveRowEdit(gift, newLink, newNote, newDoMongMuon) {
  try {
    const data = {
      action: "update",
      ten: gift.ten,
      link: newLink,
      ghichu: newNote,
      doMongMuon: newDoMongMuon || "",
      status: ACTIVE_STATUS
    };

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.status === "success" || result.success) {
      showToast("✓ Cập nhật thành công!", "success");
      await loadAndDisplayGiftsInTable();
    } else {
      throw new Error(result.message || "Không thể cập nhật");
    }
  } catch (error) {
    console.error("Error updating gift:", error);
    showToast("✗ Lỗi: " + error.message, "error");
  }
}

// ==========================================
// DELETE ROW
// ==========================================

async function deleteRow(gift) {
  const confirmed = await showConfirmDialog(
    `Bạn có chắc chắn muốn xóa "${gift.ten}"?`
  );

  if (!confirmed) return;

  showTableLoading();

  try {
    const data = {
      action: "delete",
      ten: gift.ten
    };

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.status === "success" || result.success) {
      showToast("✓ Xóa thành công!", "success");
      await loadAndDisplayGiftsInTable();
    } else {
      throw new Error(result.message || "Không thể xóa");
    }
  } catch (error) {
    console.error("Error deleting gift:", error);
    showToast("✗ Lỗi: " + error.message, "error");
  }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = "success") {
  // Create container if not exists
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✓" : "✕"}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" type="button">×</button>
  `;

  container.appendChild(toast);

  // Close button handler
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.remove();
  });

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ==========================================
// CONFIRMATION DIALOG
// ==========================================

function showConfirmDialog(message, confirmLabel = "Xóa", confirmClass = "") {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    // Create content
    const content = document.createElement("div");
    content.className = "modal-content";
    content.innerHTML = `
      <h2 class="modal-title">Xác nhận</h2>
      <p class="modal-message">${message}</p>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel" type="button">Hủy</button>
        <button class="modal-btn modal-btn-confirm ${confirmClass}" type="button">${confirmLabel}</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Event handlers
    const confirmBtn = content.querySelector(".modal-btn-confirm");
    const cancelBtn = content.querySelector(".modal-btn-cancel");

    const closeDialog = (result) => {
      overlay.remove();
      resolve(result);
    };

    confirmBtn.addEventListener("click", () => closeDialog(true));
    cancelBtn.addEventListener("click", () => closeDialog(false));

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeDialog(false);
      }
    });
  });
}

// ==========================================
// ALERT DIALOG (single button, same style as ConfirmDialog)
// ==========================================

function showAlertDialog(message, title = "Thông báo", btnLabel = "Đóng", btnClass = "") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const content = document.createElement("div");
    content.className = "modal-content";
    content.innerHTML = `
      <h2 class="modal-title">${title}</h2>
      <p class="modal-message">${message}</p>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-confirm ${btnClass}" type="button">${btnLabel}</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const closeDialog = () => { overlay.remove(); resolve(); };

    content.querySelector(".modal-btn-confirm").addEventListener("click", closeDialog);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDialog(); });
  });
}



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
// FORM STATUS BANNER
// ==========================================

function showFormBanner(message, type = "success") {
  const banner = document.getElementById("formBanner");
  const icon = document.getElementById("formBannerIcon");
  const msg = document.getElementById("formBannerMessage");
  const closeBtn = document.getElementById("formBannerClose");
  if (!banner) return;

  banner.className = "form-banner show " + type;
  icon.textContent = type === "success" ? "✓" : "✕";
  msg.textContent = message;

  closeBtn.onclick = () => {
    banner.className = "form-banner";
  };

  // Auto-hide after 5 seconds
  setTimeout(() => {
    banner.className = "form-banner";
  }, 5000);
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
  const doMongMuon = document.getElementById("doMongMuon").value;

  // Validate
  if (!ten) {
    showFormBanner("Vui lòng nhập tên món quà", "error");
    return;
  }

  if (!doMongMuon) {
    const wrapper = document.getElementById("starPickerWrapper");
    wrapper?.classList.add("error");
    const errMsg = document.getElementById("starRequiredMsg");
    if (errMsg) errMsg.classList.add("visible");
    return;
  }

  // Ask for confirmation before saving
  const confirmed = await showConfirmDialog(
    `Bạn có muốn lưu "<strong>${ten}</strong>" vào danh sách không?`,
    "Lưu",
    "save"
  );
  if (!confirmed) return;

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
      doMongMuon: doMongMuon || "",
      status: ACTIVE_STATUS
    };

    // Send to Google Sheets
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.status === "success" || result.success) {
      // Reset form first so fields are clear when dialog closes
      giftForm.reset();
      setStarPicker("starPicker", "doMongMuon", 0);

      await showAlertDialog(
        `Món quà "<strong>${ten}</strong>" đã được lưu thành công!`,
        "Thành công",
        "Đóng",
        "save"
      );

      // Reload table if it was loaded
      if (tableDataLoaded) {
        await loadAndDisplayGiftsInTable();
      }
    } else {
      throw new Error(result.message || "Unknown error");
    }
  } catch (error) {
    console.error("Error submitting gift:", error);
    showFormBanner("Có lỗi khi lưu: " + error.message, "error");
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