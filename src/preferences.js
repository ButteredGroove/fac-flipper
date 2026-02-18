const LAST_DECK_PATH_KEY = "fac-flipper:lastDeckPath";

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
  LAST_DECK_PATH_KEY,
  getLastDeckPath,
  setLastDeckPath,
  clearLastDeckPath,
};
