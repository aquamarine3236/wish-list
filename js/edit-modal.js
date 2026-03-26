/* ==========================================
   MODAL EDIT MODE
   ========================================== */

function openEditModal(gift) {
  // Populate modal with current data
  document.getElementById("editTen").value = gift.ten;
  populateLinkList("editLinkList", gift.link || "");
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

    const result = await saveGiftToSheet(data);

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
