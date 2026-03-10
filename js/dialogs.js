/* ==========================================
   CONFIRMATION DIALOG
   ========================================== */

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
