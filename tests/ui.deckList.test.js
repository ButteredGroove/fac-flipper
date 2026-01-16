import { afterEach, describe, expect, it, vi } from "vitest";

const fixture = `
  <ul id="deckList"></ul>
`;

async function setupUi() {
  document.body.innerHTML = fixture;
  vi.resetModules();
  const ui = await import("../src/ui.js");
  const stateModule = await import("../src/state.js");
  return { ...ui, state: stateModule.state };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("deck list UI", () => {
  it("renders deck buttons with versions and error text", async () => {
    const { renderDeckList, state } = await setupUi();
    state.decks = [
      { name: "Alpha", version: "1.0" },
      { name: "Broken", version: "", loadError: "Missing deck files" },
    ];

    renderDeckList(() => {});

    const buttons = document.querySelectorAll("button.deck-item");
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute("type")).toBe("button");
    expect(buttons[0].querySelector(".deck-item-name")?.textContent).toBe(
      "Alpha",
    );
    expect(buttons[0].querySelector(".deck-item-version")?.textContent).toBe(
      "v1.0",
    );
    expect(buttons[1].classList.contains("is-error")).toBe(true);
    expect(buttons[1].querySelector(".deck-item-error")?.textContent).toBe(
      "Missing deck files",
    );
  });

  it("disables deck buttons when selection is disabled", async () => {
    const { renderDeckList, setDeckSelectionEnabled, state } = await setupUi();
    state.decks = [
      { name: "Alpha", version: "1.0" },
      { name: "Beta", version: "2.0" },
    ];

    renderDeckList(() => {});
    setDeckSelectionEnabled(false);

    const buttons = document.querySelectorAll("button.deck-item");
    expect(buttons[0].disabled).toBe(true);
    expect(
      document.getElementById("deckList")?.getAttribute("aria-disabled"),
    ).toBe("true");

    setDeckSelectionEnabled(true);
    expect(buttons[0].disabled).toBe(false);
  });

  it("highlights the active deck and handles clicks", async () => {
    const { highlightDeck, renderDeckList, state } = await setupUi();
    state.decks = [
      { name: "Alpha", version: "1.0" },
      { name: "Beta", version: "2.0" },
    ];
    const onSelectDeck = vi.fn();

    renderDeckList(onSelectDeck);
    highlightDeck(1);

    const buttons = document.querySelectorAll("button.deck-item");
    expect(buttons[0].classList.contains("is-active")).toBe(false);
    expect(buttons[1].classList.contains("is-active")).toBe(true);

    buttons[1].click();
    expect(onSelectDeck).toHaveBeenCalledWith(1);
  });
});
