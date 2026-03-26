/* ==========================================
   WISHLIST APP - MAIN SCRIPT
   ==========================================
   Entry point. Wires up all event listeners
   and bootstraps the app on DOMContentLoaded.
   ========================================== */

// DOM Elements
const giftForm = document.getElementById("giftForm");
const giftsGrid = document.getElementById("giftsGrid");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const tableTab = document.getElementById("table-tab");
const giftTabs = document.getElementById("giftTabs");
let tableDataLoaded = false;

// ==========================================
// LINK LIST HELPERS
// ==========================================

function createLinkRow(value) {
  const row = document.createElement("div");
  row.className = "link-input-row";
  const input = document.createElement("input");
  input.type = "url";
  input.className = "form-control";
  input.placeholder = "https://example.com";
  input.value = value || "";
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn-link-remove";
  removeBtn.title = "Xóa";
  removeBtn.textContent = "×";
  row.appendChild(input);
  row.appendChild(removeBtn);
  return row;
}

function setupLinkList(listId, addBtnId) {
  const list = document.getElementById(listId);
  const addBtn = document.getElementById(addBtnId);

  addBtn.addEventListener("click", () => {
    list.appendChild(createLinkRow(""));
  });

  list.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-link-remove")) {
      const rows = list.querySelectorAll(".link-input-row");
      if (rows.length > 1) {
        e.target.closest(".link-input-row").remove();
      } else {
        // Last row — just clear the value
        rows[0].querySelector("input").value = "";
      }
    }
  });
}

function collectLinks(listId) {
  const inputs = document.querySelectorAll(`#${listId} .link-input-row input`);
  return Array.from(inputs)
    .map(input => input.value.trim())
    .filter(v => v !== "")
    .join("\n");
}

function populateLinkList(listId, linksString) {
  const list = document.getElementById(listId);
  list.innerHTML = "";
  const links = (linksString || "").split("\n").map(l => l.trim()).filter(l => l !== "");
  if (links.length === 0) {
    list.appendChild(createLinkRow(""));
  } else {
    links.forEach(link => list.appendChild(createLinkRow(link)));
  }
}

function resetLinkList(listId) {
  const list = document.getElementById(listId);
  list.innerHTML = "";
  list.appendChild(createLinkRow(""));
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

  // Init link lists
  setupLinkList("linkList", "addLinkBtn");
  setupLinkList("editLinkList", "editAddLinkBtn");
});

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
    const newLink = collectLinks("editLinkList");
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

// ==========================================
// HANDLE FORM SUBMISSION
// ==========================================

async function handleFormSubmit(e) {
  e.preventDefault();

  // Get form values
  const ten = document.getElementById("ten").value.trim();
  const link = collectLinks("linkList");
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

    const result = await saveGiftToSheet(data);

    if (result.status === "success" || result.success) {
      // Reset form first so fields are clear when dialog closes
      giftForm.reset();
      setStarPicker("starPicker", "doMongMuon", 0);
      resetLinkList("linkList");

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

    const result = await saveGiftToSheet(data);

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
// AUTO-LOAD ON READY
// ==========================================

console.log("Wishlist app script loaded successfully");
