/* ==========================================
   STAR PICKER
   ========================================== */

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
