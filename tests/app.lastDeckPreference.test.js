import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LAST_DECK_PATH_KEY = "fac-flipper:lastDeckPath";

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

let manifestDecks = [];
let manifestErrors = new Map();
let runtimeLoadErrors = new Set();

const ensureDeckLoaded = vi.fn(async (deck) => {
  if (runtimeLoadErrors.has(deck.path)) {
    throw new Error(`Load failed for ${deck.path}`);
  }
  deck.cards = [{ __id: "001" }];
  deck.layout = {};
});

const fetchJson = vi.fn(async () => ({
  decks: manifestDecks,
}));

const loadDeckDefinition = vi.fn(async (path) => {
  const error = manifestErrors.get(path);
  if (error) {
    throw error;
  }
  const suffix = path.split("/").at(-2) || "Deck";
  return {
    path,
    deckUrl: path,
    name: `Deck ${suffix}`,
    version: "1.0",
    dataCsv: "cards.csv",
    layoutJson: "layout.json",
    cards: null,
    layout: null,
    parseWarnings: [],
  };
});

vi.mock("../src/ui.js", () => ({
  applyLayoutVars: vi.fn(),
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
  return {
    ui,
    state: stateModule.state,
  };
}

describe("last deck preference", () => {
  beforeEach(() => {
    document.body.innerHTML = fixture;
    window.localStorage.clear();
    manifestDecks = [];
    manifestErrors = new Map();
    runtimeLoadErrors = new Set();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("loads first valid deck when no last deck is saved", async () => {
    manifestDecks = ["decks/one/deck.json", "decks/two/deck.json"];

    const { state } = await setupApp();

    expect(state.currentDeckIndex).toBe(0);
    expect(window.localStorage.getItem(LAST_DECK_PATH_KEY)).toBe(
      "decks/one/deck.json",
    );
  });

  it("loads the saved deck when it is valid", async () => {
    manifestDecks = ["decks/one/deck.json", "decks/two/deck.json"];
    window.localStorage.setItem(LAST_DECK_PATH_KEY, "decks/two/deck.json");

    const { state } = await setupApp();

    expect(state.currentDeckIndex).toBe(1);
    expect(window.localStorage.getItem(LAST_DECK_PATH_KEY)).toBe(
      "decks/two/deck.json",
    );
  });

  it("falls back and rewrites when saved path is missing from manifest", async () => {
    manifestDecks = ["decks/one/deck.json", "decks/two/deck.json"];
    window.localStorage.setItem(LAST_DECK_PATH_KEY, "decks/missing/deck.json");

    const { state } = await setupApp();

    expect(state.currentDeckIndex).toBe(0);
    expect(window.localStorage.getItem(LAST_DECK_PATH_KEY)).toBe(
      "decks/one/deck.json",
    );
  });

  it("falls back and rewrites when saved path points to manifest-invalid deck", async () => {
    manifestDecks = ["decks/bad/deck.json", "decks/good/deck.json"];
    manifestErrors.set(
      "decks/bad/deck.json",
      new Error("Missing layout_json in decks/bad/deck.json"),
    );
    window.localStorage.setItem(LAST_DECK_PATH_KEY, "decks/bad/deck.json");

    const { state } = await setupApp();

    expect(state.currentDeckIndex).toBe(1);
    expect(window.localStorage.getItem(LAST_DECK_PATH_KEY)).toBe(
      "decks/good/deck.json",
    );
  });

  it("falls back once when saved deck fails at runtime load", async () => {
    manifestDecks = ["decks/one/deck.json", "decks/two/deck.json"];
    runtimeLoadErrors.add("decks/two/deck.json");
    window.localStorage.setItem(LAST_DECK_PATH_KEY, "decks/two/deck.json");

    const { state } = await setupApp();

    expect(state.currentDeckIndex).toBe(0);
    expect(window.localStorage.getItem(LAST_DECK_PATH_KEY)).toBe(
      "decks/one/deck.json",
    );
    expect(ensureDeckLoaded).toHaveBeenCalledTimes(2);
  });

  it("updates saved deck when a manual deck switch succeeds", async () => {
    manifestDecks = ["decks/one/deck.json", "decks/two/deck.json"];

    const { ui, state } = await setupApp();
    const onSelectDeck = ui.renderDeckList.mock.calls[0][0];

    onSelectDeck(1);
    await flushPromises();
    await flushPromises();

    expect(state.currentDeckIndex).toBe(1);
    expect(window.localStorage.getItem(LAST_DECK_PATH_KEY)).toBe(
      "decks/two/deck.json",
    );
  });

  it("does not update saved deck when a manual deck switch fails", async () => {
    manifestDecks = ["decks/one/deck.json", "decks/two/deck.json"];

    const { ui, state } = await setupApp();
    const onSelectDeck = ui.renderDeckList.mock.calls[0][0];
    runtimeLoadErrors.add("decks/two/deck.json");

    onSelectDeck(1);
    await flushPromises();
    await flushPromises();

    expect(state.currentDeckIndex).toBe(1);
    expect(state.deckLoadError).toContain("Unable to load deck");
    expect(window.localStorage.getItem(LAST_DECK_PATH_KEY)).toBe(
      "decks/one/deck.json",
    );
  });

  it("still loads and switches decks when storage get/set throw", async () => {
    manifestDecks = ["decks/one/deck.json", "decks/two/deck.json"];
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked");
    });

    const { ui, state } = await setupApp();
    const onSelectDeck = ui.renderDeckList.mock.calls[0][0];

    expect(state.currentDeckIndex).toBe(0);

    onSelectDeck(1);
    await flushPromises();
    await flushPromises();

    expect(state.currentDeckIndex).toBe(1);
    expect(state.deckLoadError).toBeNull();
  });
});
