function formatVersion(version) {
  if (!version) {
    return "";
  }
  const normalized = String(version);
  return normalized.startsWith("v") ? normalized : `v${normalized}`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isTypingTarget(target) {
  if (!target) {
    return false;
  }
  const element = target instanceof Element ? target : null;
  if (!element) {
    return false;
  }
  const tagName = element.tagName?.toLowerCase();
  if (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    tagName === "button" ||
    element.isContentEditable
  ) {
    return true;
  }
  if (tagName === "a" && element.getAttribute("href")) {
    return true;
  }
  return Boolean(
    element.closest(
      "button, input, textarea, select, option, a[href], [role='button'], [role='link']",
    ),
  );
}

function getValue(value) {
  if (value === undefined || value === null) {
    return "";
  }
  const trimmed = String(value).trim();
  return trimmed;
}

export { formatTime, formatVersion, getValue, isTypingTarget };
