import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = `
  <div id="deckList"></div>
  <div id="deckName"></div>
  <div id="deckVersion"></div>
  <div id="deckDisplay"></div>
  <div id="deckWarning"></div>
  <div id="cardFrame"></div>
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

async function loadUi() {
  vi.resetModules();
  const ui = await import("../src/ui.js");
  const stateModule = await import("../src/state.js");
  return { ui, elements: stateModule.elements };
}

describe("animateCurrentCardFlip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("applies and removes animation classes when animation ends", async () => {
    document.body.innerHTML = fixture;
    const { ui, elements } = await loadUi();

    ui.animateCurrentCardFlip();

    expect(elements.cardFrame.classList.contains("is-flip-animating")).toBe(
      true,
    );
    expect(elements.card.classList.contains("is-flip-animating")).toBe(true);

    elements.cardFrame.dispatchEvent(new Event("animationend"));
    elements.card.dispatchEvent(new Event("animationend"));

    expect(elements.cardFrame.classList.contains("is-flip-animating")).toBe(
      false,
    );
    expect(elements.card.classList.contains("is-flip-animating")).toBe(false);
  });

  it("restarts animation cleanly on rapid repeated calls", async () => {
    document.body.innerHTML = fixture;
    const { ui, elements } = await loadUi();

    ui.animateCurrentCardFlip();
    ui.animateCurrentCardFlip();

    expect(elements.cardFrame.classList.contains("is-flip-animating")).toBe(
      true,
    );
    expect(elements.card.classList.contains("is-flip-animating")).toBe(true);

    vi.advanceTimersByTime(400);

    expect(elements.cardFrame.classList.contains("is-flip-animating")).toBe(
      false,
    );
    expect(elements.card.classList.contains("is-flip-animating")).toBe(false);
  });

  it("falls back to timeout cleanup when animationend does not fire", async () => {
    document.body.innerHTML = fixture;
    const { ui, elements } = await loadUi();

    ui.animateCurrentCardFlip();

    expect(elements.cardFrame.classList.contains("is-flip-animating")).toBe(
      true,
    );
    expect(elements.card.classList.contains("is-flip-animating")).toBe(true);

    vi.advanceTimersByTime(400);

    expect(elements.cardFrame.classList.contains("is-flip-animating")).toBe(
      false,
    );
    expect(elements.card.classList.contains("is-flip-animating")).toBe(false);
  });

  it("is a no-op when required elements are missing", async () => {
    document.body.innerHTML = "";
    const { ui } = await loadUi();

    expect(() => ui.animateCurrentCardFlip()).not.toThrow();
  });
});
