const LAST_DECK_PATH_KEY = "fac-flipper:lastDeckPath";
const DRAW_ANIMATION_KEY = "fac-flipper:drawAnimation";

function getDrawAnimationPreference() {
  try {
    const value = window.localStorage.getItem(DRAW_ANIMATION_KEY);
    return value === "opaque" || value === "full" ? "opaque" : "translucent";
  } catch {
    return "translucent";
  }
}

function setDrawAnimationPreference(value) {
  if (value !== "opaque" && value !== "translucent") {
    return;
  }
  try {
    window.localStorage.setItem(DRAW_ANIMATION_KEY, value);
  } catch {
    // The selected mode remains active for this session.
  }
}

function getLastDeckPath() {
  try {
    const value = window.localStorage.getItem(LAST_DECK_PATH_KEY);
    return value ? value : null;
  } catch {
    return null;
  }
}

function setLastDeckPath(path) {
  if (typeof path !== "string" || path.trim() === "") {
    return;
  }
  try {
    window.localStorage.setItem(LAST_DECK_PATH_KEY, path);
  } catch {
    // Ignore storage write failures.
  }
}

function clearLastDeckPath() {
  try {
    window.localStorage.removeItem(LAST_DECK_PATH_KEY);
  } catch {
    // Ignore storage clear failures.
  }
}

export {
  getDrawAnimationPreference,
  setDrawAnimationPreference,
  getLastDeckPath,
  setLastDeckPath,
  clearLastDeckPath,
};
