const MAX_HISTORY = 10;

const elements = {
  deckList: document.getElementById("deckList"),
  deckName: document.getElementById("deckName"),
  deckVersion: document.getElementById("deckVersion"),
  deckDisplay: document.getElementById("deckDisplay"),
  cardFrame: document.getElementById("cardFrame"),
  card: document.getElementById("card"),
  previewColumn: document.getElementById("previewColumn"),
  previewFrame: document.getElementById("previewFrame"),
  previewCard: document.getElementById("previewCard"),
  clearPreview: document.getElementById("clearPreview"),
  drawButton: document.getElementById("drawButton"),
  resetButtonTop: document.getElementById("resetButtonTop"),
  reshuffleButton: document.getElementById("reshuffleButton"),
  replacementToggleSide: document.getElementById("replacementToggleSide"),
  remainingText: document.getElementById("remainingText"),
  historyList: document.getElementById("historyList"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalOk: document.getElementById("modalOk"),
  modalBody: document.querySelector(".modal-body"),
};

const state = {
  decks: [],
  currentDeck: null,
  currentCard: null,
  previewCard: null,
  history: [],
  withoutReplacement: false,
  shoe: [],
  modalOpen: false,
};

export { MAX_HISTORY, elements, state };
