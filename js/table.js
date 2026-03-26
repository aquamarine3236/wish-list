/* ==========================================
   TABLE — render gifts, rows, and action menus
   ========================================== */

// Table DOM elements
const giftsTableBody = document.getElementById("giftsTableBody");
const tableLoadingState = document.getElementById("tableLoadingState");
const tableEmptyState = document.getElementById("tableEmptyState");
const tableWrapper = document.getElementById("tableWrapper");

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

function displayGiftsInTable(gifts) {
  // Remove any previously appended action menus from body
  document.querySelectorAll("body > .action-menu").forEach(m => m.remove());
  giftsTableBody.innerHTML = "";

  gifts.forEach((gift, index) => {
    const row = createTableRow(gift, index);
    giftsTableBody.appendChild(row);
  });
}

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
  const rawLinks = (gift.link || "").split("\n").map(l => l.trim()).filter(l => l !== "");
  if (rawLinks.length > 0) {
    const linksContainer = document.createElement("div");
    linksContainer.className = "cell-links-list";
    rawLinks.forEach((url, i) => {
      const a = document.createElement("a");
      a.href = normalizeUrl(url);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = rawLinks.length === 1 ? "Link" : `Link ${i + 1}`;
      a.title = url;
      linksContainer.appendChild(a);
    });
    linkCell.appendChild(valueSpan(linksContainer));
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
