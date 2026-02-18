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
    if (deck.name === "Bad Deck") {
      return Promise.reject(new Error("Missing deck files"));
    }
    deck.cards = [{ __id: "001" }];
    deck.layout = {};
    return Promise.resolve();
  }),
  fetchJson: vi.fn(async () => ({
    decks: ["decks/bad/deck.json", "decks/good/deck.json"],
  })),
  loadDeckDefinition: vi.fn(async (path) => {
    const isBad = path.includes("bad");
    return {
      path,
      deckUrl: path,
      name: isBad ? "Bad Deck" : "Good Deck",
      version: "1.0",
      dataCsv: "cards.csv",
      layoutJson: "layout.json",
      cards: null,
      layout: null,
      parseWarnings: [],
    };
  }),
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

describe("deck load failures", () => {
  beforeEach(() => {
    document.body.innerHTML = fixture;
    window.localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("shows a clear error and keeps controls disabled", async () => {
    const { ui, state } = await setupApp();

    expect(ui.renderDeckLoadError).toHaveBeenCalledWith(
      expect.stringContaining("Unable to load deck"),
    );
    expect(ui.setDeckControlsEnabled).toHaveBeenCalledWith(false);
    expect(ui.setDrawEnabled).toHaveBeenCalledWith(false);
    expect(ui.setDeckSelectionEnabled).toHaveBeenLastCalledWith(true);
    expect(state.deckLoadError).toContain("Unable to load deck");
  });

  it("recovers when a valid deck is selected", async () => {
    const { ui, state } = await setupApp();
    const onSelectDeck = ui.renderDeckList.mock.calls[0][0];

    ui.setDrawEnabled.mockClear();
    ui.setDeckControlsEnabled.mockClear();

    onSelectDeck(1);
    await flushPromises();
    await flushPromises();

    expect(state.deckLoadError).toBeNull();
    expect(ui.setDeckControlsEnabled).toHaveBeenLastCalledWith(true);
    expect(ui.setDrawEnabled).toHaveBeenLastCalledWith(true);
  });
});
