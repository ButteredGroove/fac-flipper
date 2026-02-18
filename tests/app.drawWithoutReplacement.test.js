import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = `
  <div id="deckList"></div>
  <div id="deckName"></div>
  <div id="deckVersion"></div>
  <div id="deckDisplay"></div>
  <div id="cardFrame" tabindex="0"></div>
  <div id="card"></div>
  <div id="previewColumn"></div>
  <div id="previewFrame"></div>
  <div id="previewCard"></div>
  <button id="clearPreview" type="button"></button>
  <button id="drawButton" type="button"></button>
  <button id="aboutButton" type="button"></button>
  <button id="resetButtonTop" type="button"></button>
  <button id="reshuffleButton" type="button"></button>
  <input id="replacementToggleSide" type="checkbox" />
  <div id="remainingText"></div>
  <div id="historyList"></div>
  <div id="modalOverlay"></div>
  <div id="modal"></div>
  <div id="modalTitle"></div>
  <button id="modalOk" type="button"></button>
  <button id="modalCancel" type="button"></button>
  <div id="modalBody"></div>
`;

const flushPromises = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const cards = Array.from({ length: 3 }, (_, i) => ({
  __id: String(i + 1).padStart(3, "0"),
}));

vi.mock("../src/ui.js", () => ({
  applyLayoutVars: vi.fn(),
  animateCurrentCardFlip: vi.fn(),
  closeModal: vi.fn(),
  getLayoutMetrics: vi.fn(() => ({
    cols: 12,
    rows: 16,
    width: 0,
    hasWidth: false,
    textScale: 1,
    hasTextScale: false,
  })),
  highlightDeck: vi.fn(),
  openAboutModal: vi.fn(),
  openModal: vi.fn(),
  renderCard: vi.fn(),
  renderDeckError: vi.fn(),
  renderDeckLoadError: vi.fn(),
  renderDeckList: vi.fn(),
  renderDeckWarning: vi.fn(),
  renderHistory: vi.fn(),
  renderPreviewCard: vi.fn(),
  setDeckControlsEnabled: vi.fn(),
  setDeckSelectionEnabled: vi.fn(),
  setDrawEnabled: vi.fn(),
  updateDeckDisplay: vi.fn(),
  updateRemaining: vi.fn(),
}));

vi.mock("../src/utils.js", () => ({
  formatTime: vi.fn(() => "1:23 PM"),
  isTypingTarget: vi.fn(() => false),
}));

vi.mock("../src/deck.js", () => ({
  ensureDeckLoaded: vi.fn(async () => {}),
  fetchJson: vi.fn(async () => ({
    decks: ["decks/one/deck.json"],
  })),
  loadDeckDefinition: vi.fn(async (path) => ({
    path,
    deckUrl: path,
    name: "Test Deck",
    version: "1.0",
    dataCsv: "cards.csv",
    layoutJson: "layout.json",
    cards,
    layout: { card: { grid: { cols: 12, rows: 16 } }, blocks: [] },
    parseWarnings: [],
  })),
  shuffle: vi.fn((list) => list),
}));

async function setupApp() {
  document.body.innerHTML = fixture;
  vi.resetModules();
  await import("../app.js");
  const ui = await import("../src/ui.js");
  const deck = await import("../src/deck.js");
  const stateModule = await import("../src/state.js");
  await flushPromises();
  await flushPromises();
  return {
    ui,
    deck,
    state: stateModule.state,
    elements: stateModule.elements,
  };
}

describe("draw without replacement", () => {
  beforeEach(() => {
    document.body.innerHTML = fixture;
    window.localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("reshuffles and draws from the shoe when it is empty", async () => {
    const { ui, deck, state, elements } = await setupApp();

    state.withoutReplacement = true;
    state.shoe = [];
    ui.openModal.mockClear();
    ui.updateRemaining.mockClear();
    deck.shuffle.mockClear();

    elements.drawButton.click();

    expect(deck.shuffle).toHaveBeenCalledTimes(1);
    expect(ui.openModal).toHaveBeenCalledWith({
      title: "Deck reshuffled",
      body: "Deck exhausted, reshuffled.",
    });
    expect(state.currentCard.__id).toBe("003");
    expect(state.shoe).toEqual([0, 1]);
    expect(ui.updateRemaining).toHaveBeenCalled();
  });

  it("draws from an existing shoe without reshuffling", async () => {
    const { ui, deck, state, elements } = await setupApp();

    state.withoutReplacement = true;
    state.shoe = [0, 1];
    ui.openModal.mockClear();
    ui.updateRemaining.mockClear();
    deck.shuffle.mockClear();

    elements.drawButton.click();

    expect(deck.shuffle).not.toHaveBeenCalled();
    expect(ui.openModal).not.toHaveBeenCalled();
    expect(state.currentCard.__id).toBe("002");
    expect(state.shoe).toEqual([0]);
    expect(ui.updateRemaining).toHaveBeenCalled();
  });
});
