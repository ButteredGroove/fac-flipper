function formatVersion(version) {
  if (!version) {
    return "";
  }
  return version.startsWith("v") ? version : `v${version}`;
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
  const tagName = target.tagName?.toLowerCase();
  return (
    tagName === "input" || tagName === "textarea" || target.isContentEditable
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
