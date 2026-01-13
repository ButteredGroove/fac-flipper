import {
  ensureDeckLoaded,
  fetchJson,
  loadDeckDefinition,
  shuffle,
} from "./src/deck.js";
import { MAX_HISTORY, elements, state } from "./src/state.js";
import {
  applyLayoutVars,
  closeModal,
  getLayoutMetrics,
  highlightDeck,
  openAboutModal,
  openModal,
  renderCard,
  renderDeckError,
  renderDeckList,
  renderHistory,
  renderPreviewCard,
  setDrawEnabled,
  updateDeckDisplay,
  updateRemaining,
} from "./src/ui.js";
import { formatTime, isTypingTarget } from "./src/utils.js";

init();

function init() {
  wireEvents();
  loadDeckManifest();
}

function wireEvents() {
  elements.drawButton.addEventListener("click", drawCard);
  elements.cardFrame.addEventListener("click", drawCard);
  elements.cardFrame.addEventListener("keydown", (event) => {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      drawCard();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (isTypingTarget(event.target) || state.modalOpen) {
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
    setReplacementMode(event.target.checked);
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
  if (!state.currentDeck || state.modalOpen) {
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
  if (state.currentDeckIndex === index) {
    return;
  }
  const deckName = deck.name || "this deck";
  openModal({
    title: "Change deck?",
    body: `Switch to ${deckName}? This will clear the current card and history.`,
    confirmLabel: "Change deck",
    cancelLabel: "Cancel",
    onConfirm: () => {
      void selectDeck(index);
    },
  });
}

async function loadDeckManifest() {
  setDrawEnabled(false);
  try {
    const manifest = await fetchJson("decks/index.json");
    if (!Array.isArray(manifest.decks)) {
      throw new Error("Deck manifest is missing a decks array.");
    }

    const deckEntries = await Promise.all(
      manifest.decks.map((path) => loadDeckDefinition(path)),
    );

    state.decks = deckEntries;
    renderDeckList(requestDeckChange);

    if (state.decks.length > 0) {
      await selectDeck(0);
    }
  } catch (error) {
    renderDeckError(error.message);
  }
}

async function selectDeck(index) {
  const deck = state.decks[index];
  if (!deck) {
    return;
  }
  if (state.currentDeckIndex === index) {
    return;
  }

  state.currentDeck = deck;
  state.currentDeckIndex = index;
  state.currentCard = null;
  state.history = [];
  state.previewCard = null;
  updateDeckDisplay(deck);
  highlightDeck(index);
  clearPreview();

  await ensureDeckLoaded(deck);
  const layoutMetrics = getLayoutMetrics(deck.layout);
  applyLayoutVars(elements.cardFrame, elements.card, layoutMetrics);
  applyLayoutVars(elements.previewFrame, elements.previewCard, layoutMetrics);
  resetShoe();
  renderCard();
  setDrawEnabled(true);
}

function drawCard() {
  if (
    !state.currentDeck ||
    !state.currentDeck.cards?.length ||
    state.modalOpen
  ) {
    return;
  }

  let cardIndex = 0;
  if (state.withoutReplacement) {
    if (state.shoe.length === 0) {
      resetShoe();
      openModal({
        title: "Deck reshuffled",
        body: "Deck expended, reshuffled.",
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
  updateRemaining();
}

function reshuffleDeck(clearHistory) {
  if (!state.currentDeck) {
    return;
  }
  if (clearHistory) {
    state.history = [];
    state.currentCard = null;
    state.previewCard = null;
    renderHistory(setPreviewCard);
    renderPreviewCard();
    renderCard();
  }
  resetShoe();
  updateRemaining();
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

function setReplacementMode(withoutReplacement) {
  state.withoutReplacement = withoutReplacement;
  elements.replacementToggleSide.checked = withoutReplacement;
  resetShoe();
  updateRemaining();
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
  state.previewCard = card;
  renderPreviewCard();
  renderHistory(setPreviewCard);
}

function clearPreview() {
  state.previewCard = null;
  renderPreviewCard();
  renderHistory(setPreviewCard);
}
