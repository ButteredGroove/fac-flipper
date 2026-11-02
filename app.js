import {
  ensureDeckLoaded,
  fetchJson,
  loadDeckDefinition,
  shuffle,
} from "./src/deck.js";
import {
  clearLastDeckPath,
  getLastDeckPath,
  setLastDeckPath,
} from "./src/preferences.js";
import { MAX_HISTORY, elements, state } from "./src/state.js";
import {
  animateCurrentCardFlip,
  applyLayoutVars,
  closeModal,
  getLayoutMetrics,
  highlightDeck,
  openAboutModal,
  openModal,
  renderCard,
  renderDeckError,
  renderDeckList,
  renderDeckLoadError,
  renderDeckWarning,
  renderHistory,
  renderPreviewCard,
  setDeckControlsEnabled,
  setDeckSelectionEnabled,
  setDrawEnabled,
  updateDeckDisplay,
  updateRemaining,
} from "./src/ui.js";
import { formatTime, isTypingTarget } from "./src/utils.js";

init();

function init() {
  wireEvents();
  syncReplacementControl();
  loadDeckManifest();
}

function wireEvents() {
  window.addEventListener("pageshow", syncReplacementControl);
  elements.drawButton.addEventListener("click", drawCard);
  elements.cardFrame.addEventListener("click", drawCard);
  elements.cardFrame.addEventListener("keydown", (event) => {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      drawCard();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (state.modalOpen) {
      handleModalKeydown(event);
      return;
    }
    if (isTypingTarget(event.target)) {
      return;
    }
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      drawCard();
    }
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      requestReshuffle(false);
    }
  });

  elements.resetButtonTop.addEventListener("click", () =>
    requestReshuffle(true),
  );
  elements.reshuffleButton.addEventListener("click", () =>
    requestReshuffle(false),
  );
  elements.aboutButton.addEventListener("click", openAboutModal);

  elements.replacementToggleSide.addEventListener("change", (event) => {
    requestReplacementMode(event.target.checked);
  });

  elements.clearPreview.addEventListener("click", clearPreview);

  elements.modalOk.addEventListener("click", handleModalConfirm);
  elements.modalCancel.addEventListener("click", handleModalCancel);
  elements.modalOverlay.addEventListener("click", (event) => {
    if (event.target === elements.modalOverlay) {
      handleModalOverlayClick();
    }
  });
}

function syncReplacementControl() {
  elements.replacementToggleSide.checked = state.withoutReplacement;
  updateRemaining();
}

function handleModalKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    handleModalCancel();
    return;
  }
  if (event.key !== "Tab") {
    return;
  }
  const focusable = [
    ...elements.modal.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ].filter(
    (element) =>
      !element.disabled &&
      element.tabIndex >= 0 &&
      !element.closest("[hidden], [inert]"),
  );
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      !elements.modal.contains(document.activeElement))
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (document.activeElement === last ||
      !elements.modal.contains(document.activeElement))
  ) {
    event.preventDefault();
    first.focus();
  }
}

function handleModalConfirm() {
  const onConfirm = state.modalOnConfirm;
  closeModal();
  if (onConfirm) {
    onConfirm();
  }
}

function handleModalCancel() {
  const onCancel = state.modalOnCancel;
  closeModal();
  if (onCancel) {
    onCancel();
  }
}

function handleModalOverlayClick() {
  if (!state.modalCloseOnOverlay) {
    return;
  }
  handleModalCancel();
}

function requestReshuffle(clearHistory) {
  if (
    !state.currentDeck ||
    state.modalOpen ||
    state.deckLoading ||
    state.deckLoadError
  ) {
    return;
  }
  if (state.history.length === 0) {
    reshuffleDeck(clearHistory);
    return;
  }
  const title = clearHistory ? "Reset deck?" : "Reshuffle deck?";
  const body = clearHistory
    ? "This will reshuffle the deck and clear the current card and history."
    : "This will reshuffle the deck without clearing history.";
  const confirmLabel = clearHistory ? "Reset" : "Reshuffle";
  openModal({
    title,
    body,
    confirmLabel,
    cancelLabel: "Cancel",
    onConfirm: () => reshuffleDeck(clearHistory),
  });
}

function requestDeckChange(index) {
  const deck = state.decks[index];
  if (!deck || state.modalOpen) {
    return;
  }
  if (state.currentDeckIndex === index && !state.deckLoadError) {
    return;
  }
  if (state.history.length === 0) {
    void selectDeck(index);
    return;
  }
  const deckName = deck.name || "this deck";
  openModal({
    title: "Change deck?",
    body: `Switch to ${deckName}? This will clear the current card and history.`,
    confirmLabel: "Change deck",
    cancelLabel: "Cancel",
    onConfirm: () => void selectDeck(index),
  });
}

function getDeckDefinitionErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function createInvalidDeckEntry(path, error) {
  const deckPath = typeof path === "string" ? path : String(path ?? "");
  let deckUrl = deckPath;
  try {
    deckUrl = new URL(deckPath, window.location.href).toString();
  } catch {
    // Fallback to the raw path when URL parsing fails.
  }
  return {
    path: deckPath,
    deckUrl,
    name: "Invalid deck",
    version: "",
    dataCsv: null,
    layoutJson: null,
    cards: null,
    layout: null,
    parseWarnings: [],
    loadError: getDeckDefinitionErrorMessage(error),
  };
}

async function loadDeckManifest() {
  setDrawEnabled(false);
  setDeckControlsEnabled(false);
  try {
    const manifest = await fetchJson("decks/index.json");
    if (!Array.isArray(manifest.decks)) {
      throw new Error("Deck manifest is missing a decks array.");
    }

    const deckResults = await Promise.allSettled(
      manifest.decks.map((path) => loadDeckDefinition(path)),
    );

    const deckEntries = deckResults.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return createInvalidDeckEntry(manifest.decks[index], result.reason);
    });

    state.decks = deckEntries;
    renderDeckList(requestDeckChange);

    const candidates = state.decks
      .map((deck, index) => (deck.loadError ? -1 : index))
      .filter((index) => index >= 0);
    if (candidates.length === 0) {
      clearLastDeckPath();
      if (state.decks.length > 0) {
        await selectDeck(0);
      }
      return;
    }

    const lastDeckPath = getLastDeckPath();
    const rememberedDeckIndex = lastDeckPath
      ? state.decks.findIndex(
          (deck) => deck.path === lastDeckPath && !deck.loadError,
        )
      : -1;

    if (rememberedDeckIndex >= 0) {
      candidates.splice(candidates.indexOf(rememberedDeckIndex), 1);
      candidates.unshift(rememberedDeckIndex);
    }

    for (const index of candidates) {
      const pendingLoad = selectDeck(index);
      const loadToken = state.deckLoadToken;
      const loaded = await pendingLoad;
      if (loaded || state.deckLoadToken !== loadToken) {
        return;
      }
    }
  } catch (error) {
    renderDeckWarning([]);
    renderDeckError(error.message);
  }
}

function getDeckLoadErrorMessage(error, deck) {
  const detail = error instanceof Error ? error.message : "";
  const deckName = deck?.name ? ` "${deck.name}"` : "";
  const base = `Unable to load deck${deckName}.`;
  const hint = "Select another deck to continue.";
  if (!detail) {
    return `${base} ${hint}`;
  }
  return `${base} ${detail} ${hint}`;
}

async function selectDeck(index) {
  const deck = state.decks[index];
  if (!deck) {
    return false;
  }
  if (state.currentDeckIndex === index && !state.deckLoadError) {
    return true;
  }

  state.deckLoadToken += 1;
  const loadToken = state.deckLoadToken;
  state.deckLoading = true;
  state.deckLoadError = null;
  setDeckSelectionEnabled(false);
  setDrawEnabled(false);
  setDeckControlsEnabled(false);

  state.currentDeck = deck;
  state.currentDeckIndex = index;
  state.currentCard = null;
  state.history = [];
  updateDeckDisplay(deck);
  highlightDeck(index);
  clearPreview();
  renderDeckWarning([]);

  try {
    await ensureDeckLoaded(deck);
    if (state.deckLoadToken !== loadToken) {
      return false;
    }
    const layoutMetrics = getLayoutMetrics(deck.layout);
    applyLayoutVars(elements.cardFrame, elements.card, layoutMetrics);
    applyLayoutVars(elements.previewFrame, elements.previewCard, layoutMetrics);
    resetShoe();
    renderCard();
    renderDeckWarning(deck.parseWarnings);
    setDrawEnabled(true);
    setDeckControlsEnabled(true);
    state.deckLoadError = null;
    setLastDeckPath(deck.path);
    return true;
  } catch (error) {
    if (state.deckLoadToken !== loadToken) {
      return false;
    }
    state.shoe = [];
    updateRemaining();
    const message = getDeckLoadErrorMessage(error, deck);
    state.deckLoadError = message;
    renderDeckLoadError(message);
    renderDeckWarning([]);
    setDrawEnabled(false);
    setDeckControlsEnabled(false);
    return false;
  } finally {
    if (state.deckLoadToken === loadToken) {
      state.deckLoading = false;
      setDeckSelectionEnabled(true);
    }
  }
}

function drawCard() {
  if (
    !state.currentDeck ||
    !state.currentDeck.cards?.length ||
    state.modalOpen ||
    state.deckLoading ||
    state.deckLoadError
  ) {
    return;
  }

  let cardIndex = 0;
  if (state.withoutReplacement) {
    if (state.shoe.length === 0) {
      resetShoe();
      openModal({
        title: "Deck reshuffled",
        body: "Deck exhausted, reshuffled.",
      });
    }
    cardIndex = state.shoe.pop();
  } else {
    cardIndex = Math.floor(Math.random() * state.currentDeck.cards.length);
  }

  const card = state.currentDeck.cards[cardIndex];
  if (!card) {
    return;
  }

  state.currentCard = card;
  addToHistory(card);
  renderCard();
  animateCurrentCardFlip();
  updateRemaining();
}

function reshuffleDeck(clearHistory) {
  if (!state.currentDeck) {
    return;
  }
  if (clearHistory) {
    state.history = [];
    state.currentCard = null;
    clearPreview();
    renderCard();
  }
  resetShoe();
}

function resetShoe() {
  const cards = state.currentDeck?.cards || [];
  if (state.withoutReplacement && cards.length > 0) {
    state.shoe = shuffle(Array.from({ length: cards.length }, (_, i) => i));
  } else {
    state.shoe = [];
  }
  updateRemaining();
}

function requestReplacementMode(withoutReplacement) {
  if (
    state.modalOpen ||
    !state.currentDeck ||
    state.deckLoading ||
    state.deckLoadError
  ) {
    elements.replacementToggleSide.checked = state.withoutReplacement;
    return;
  }

  if (!withoutReplacement && state.withoutReplacement) {
    const deckSize = state.currentDeck.cards?.length || 0;
    const remaining = state.shoe.length;
    if (deckSize > 0 && remaining < deckSize) {
      elements.replacementToggleSide.checked = true;
      openModal({
        title: "Turn off without replacement?",
        body: `You have ${remaining} of ${deckSize} cards remaining. Turning this off will reshuffle the deck.`,
        confirmLabel: "Turn off",
        cancelLabel: "Keep on",
        onConfirm: () => setReplacementMode(false),
      });
      return;
    }
  }

  setReplacementMode(withoutReplacement);
}

function setReplacementMode(withoutReplacement) {
  state.withoutReplacement = withoutReplacement;
  elements.replacementToggleSide.checked = withoutReplacement;
  resetShoe();
}

function addToHistory(card) {
  const entry = {
    id: card.__id,
    time: formatTime(new Date()),
    card,
  };
  state.history.unshift(entry);
  if (state.history.length > MAX_HISTORY) {
    state.history.pop();
  }
  renderHistory(setPreviewCard);
  renderPreviewCard();
}

function setPreviewCard(card) {
  if (state.deckLoading || state.deckLoadError) {
    return;
  }
  state.previewCard = card;
  renderPreviewCard();
  renderHistory(setPreviewCard);
}

function clearPreview() {
  state.previewCard = null;
  renderPreviewCard();
  renderHistory(setPreviewCard);
}
