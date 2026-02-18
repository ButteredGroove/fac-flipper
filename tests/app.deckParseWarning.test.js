import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = `
  <div id="deckList"></div>
  <div id="deckName"></div>
  <div id="deckVersion"></div>
  <div id="deckDisplay"></div>
  <div id="deckWarning"></div>
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
  ensureDeckLoaded: vi.fn((deck) => {
    deck.cards = [{ __id: "001" }];
    deck.layout = {};
    deck.parseWarnings = [{ type: "Quotes", code: "MissingQuotes" }];
    return Promise.resolve();
  }),
  fetchJson: vi.fn(async () => ({
    decks: ["decks/warn/deck.json"],
  })),
  loadDeckDefinition: vi.fn(async (path) => ({
    path,
    deckUrl: path,
    name: "Warn Deck",
    version: "1.0",
    dataCsv: "cards.csv",
    layoutJson: "layout.json",
    cards: null,
    layout: null,
    parseWarnings: [],
  })),
  shuffle: vi.fn((list) => list),
}));

async function setupApp() {
  document.body.innerHTML = fixture;
  vi.resetModules();
  await import("../app.js");
  const ui = await import("../src/ui.js");
  await flushPromises();
  await flushPromises();
  return { ui };
}

describe("deck parse warnings", () => {
  beforeEach(() => {
    document.body.innerHTML = fixture;
    window.localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("shows a warning when PapaParse reports errors", async () => {
    const { ui } = await setupApp();

    expect(ui.renderDeckWarning).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: "Quotes", code: "MissingQuotes" }),
      ]),
    );
  });
});
