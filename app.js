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
      reshuffleDeck(false);
    }
  });

  elements.resetButtonTop.addEventListener("click", () => reshuffleDeck(true));
  elements.reshuffleButton.addEventListener("click", () =>
    reshuffleDeck(false),
  );

  elements.replacementToggleSide.addEventListener("change", (event) => {
    setReplacementMode(event.target.checked);
  });

  elements.clearPreview.addEventListener("click", clearPreview);

  elements.modalOk.addEventListener("click", closeModal);
  elements.modalOverlay.addEventListener("click", (event) => {
    if (event.target === elements.modalOverlay) {
      closeModal();
    }
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
    renderDeckList(selectDeck);

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

  state.currentDeck = deck;
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
      openModal("Deck expended, reshuffled.");
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
