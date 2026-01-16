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
  renderHistory: vi.fn(),
  renderPreviewCard: vi.fn(),
  setDeckControlsEnabled: vi.fn(),
  setDeckSelectionEnabled: vi.fn(),
  setDrawEnabled: vi.fn(),
  updateDeckDisplay: vi.fn(),
  updateRemaining: vi.fn(),
}));

vi.mock("../src/deck.js", () => ({
  ensureDeckLoaded: vi.fn(async () => {}),
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
      cards: [{ __id: "001" }, { __id: "002" }],
      layout: {},
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
  return { ui, state: stateModule.state, elements: stateModule.elements };
}

describe("confirmation dialogs", () => {
  beforeEach(() => {
    document.body.innerHTML = fixture;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("skips deck change confirmation when history is empty", async () => {
    const { ui, state } = await setupApp();
    const onSelectDeck = ui.renderDeckList.mock.calls[0][0];

    state.history = [];
    ui.openModal.mockClear();
    onSelectDeck(1);
    await flushPromises();

    expect(ui.openModal).not.toHaveBeenCalled();
    expect(state.currentDeckIndex).toBe(1);
  });

  it("shows deck change confirmation when history has entries", async () => {
    const { ui, state } = await setupApp();
    const onSelectDeck = ui.renderDeckList.mock.calls[0][0];

    state.history = [{ id: "001", card: {} }];
    ui.openModal.mockClear();
    onSelectDeck(1);
    await flushPromises();

    expect(ui.openModal).toHaveBeenCalled();
    expect(state.currentDeckIndex).toBe(0);
  });

  it("skips reset and reshuffle confirmations when history is empty", async () => {
    const { ui, state, elements } = await setupApp();

    state.history = [];
    ui.openModal.mockClear();
    elements.resetButtonTop.click();
    elements.reshuffleButton.click();

    expect(ui.openModal).not.toHaveBeenCalled();
  });

  it("shows reset and reshuffle confirmations when history has entries", async () => {
    const { ui, state, elements } = await setupApp();

    state.history = [{ id: "001", card: {} }];
    ui.openModal.mockClear();
    elements.resetButtonTop.click();
    elements.reshuffleButton.click();

    expect(ui.openModal).toHaveBeenCalledTimes(2);
  });
});
