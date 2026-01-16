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

const deckLoads = new Map();

const createDeferred = () => {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const getDeferred = (name) => {
  if (!deckLoads.has(name)) {
    deckLoads.set(name, createDeferred());
  }
  return deckLoads.get(name);
};

const resolveLoad = (name) => {
  getDeferred(name).resolve();
};

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
  ensureDeckLoaded: vi.fn((deck) => {
    if (deck.cards && deck.layout) {
      return Promise.resolve();
    }
    const deferred = getDeferred(deck.name);
    return deferred.promise.then(() => {
      deck.cards = [{ __id: "001" }];
      deck.layout = { name: deck.name };
    });
  }),
  fetchJson: vi.fn(async () => ({
    decks: ["decks/one/deck.json", "decks/two/deck.json"],
  })),
  loadDeckDefinition: vi.fn(async (path) => {
    const suffix = path.includes("two") ? "Two" : "One";
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
  }),
  shuffle: vi.fn((list) => list),
}));

async function setupApp() {
  document.body.innerHTML = fixture;
  vi.resetModules();
  const appPromise = import("../app.js");
  resolveLoad("Deck One");
  await appPromise;
  const ui = await import("../src/ui.js");
  const stateModule = await import("../src/state.js");
  await flushPromises();
  await flushPromises();
  return { ui, state: stateModule.state };
}

describe("deck load guards", () => {
  beforeEach(() => {
    document.body.innerHTML = fixture;
    deckLoads.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("ignores stale deck load completions", async () => {
    const { ui, state } = await setupApp();
    const onSelectDeck = ui.renderDeckList.mock.calls[0][0];

    ui.renderCard.mockClear();
    ui.setDrawEnabled.mockClear();

    onSelectDeck(1);
    await flushPromises();

    onSelectDeck(0);
    await flushPromises();
    await flushPromises();

    const renderCardCount = ui.renderCard.mock.calls.length;
    const drawEnabledCount = ui.setDrawEnabled.mock.calls.filter(
      ([enabled]) => enabled,
    ).length;

    resolveLoad("Deck Two");
    await flushPromises();
    await flushPromises();

    expect(state.currentDeckIndex).toBe(0);
    expect(ui.renderCard.mock.calls.length).toBe(renderCardCount);
    expect(
      ui.setDrawEnabled.mock.calls.filter(([enabled]) => enabled).length,
    ).toBe(drawEnabledCount);
  });
});
