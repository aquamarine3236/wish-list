/* ==========================================
   TOAST NOTIFICATIONS
   ========================================== */

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
