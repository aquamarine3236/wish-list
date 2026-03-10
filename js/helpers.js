/* ==========================================
   UTILITIES — URL helpers
   ========================================== */

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
