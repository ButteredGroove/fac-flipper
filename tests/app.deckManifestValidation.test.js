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

const loadDeckDefinition = vi.fn();
const ensureDeckLoaded = vi.fn((deck) => {
  deck.cards = [{ __id: "001" }];
  deck.layout = {};
  return Promise.resolve();
});
const fetchJson = vi.fn(async () => ({
  decks: [
    "decks/invalid-one/deck.json",
    "decks/valid/deck.json",
    "decks/invalid-two/deck.json",
  ],
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

vi.mock("../src/deck.js", () => ({
  ensureDeckLoaded,
  fetchJson,
  loadDeckDefinition,
  shuffle: vi.fn((list) => list),
}));

async function setupApp() {
  document.body.innerHTML = fixture;
  vi.resetModules();
  await import("../app.js");
  const ui = await import("../src/ui.js");
  const stateModule = await import("../src/state.js");
  await flushPromises();
  await flushPromises();
  return { ui, state: stateModule.state };
}

describe("deck manifest validation", () => {
  beforeEach(() => {
    document.body.innerHTML = fixture;
    window.localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("keeps valid decks and stores errors for invalid manifests", async () => {
    loadDeckDefinition.mockImplementation((path) => {
      if (path.includes("invalid-one")) {
        return Promise.reject(new Error(`Missing data_csv in ${path}`));
      }
      if (path.includes("invalid-two")) {
        return Promise.reject(new Error(`Missing layout_json in ${path}`));
      }
      return Promise.resolve({
        path,
        deckUrl: path,
        name: "Good Deck",
        version: "1.0",
        dataCsv: "cards.csv",
        layoutJson: "layout.json",
        cards: null,
        layout: null,
        parseWarnings: [],
      });
    });

    const { ui, state } = await setupApp();

    expect(ui.renderDeckError).not.toHaveBeenCalled();
    expect(state.decks).toHaveLength(3);
    const errors = state.decks.filter((deck) => deck.loadError);
    expect(errors).toHaveLength(2);
    expect(errors.map((deck) => deck.loadError)).toEqual(
      expect.arrayContaining([
        "Missing data_csv in decks/invalid-one/deck.json",
        "Missing layout_json in decks/invalid-two/deck.json",
      ]),
    );
    expect(state.currentDeckIndex).toBe(1);
    expect(ensureDeckLoaded).toHaveBeenCalledTimes(1);
    expect(ensureDeckLoaded).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Good Deck" }),
    );
  });
});
