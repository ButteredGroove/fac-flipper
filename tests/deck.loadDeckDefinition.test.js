import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadDeckDefinition } from "../src/deck.js";

describe("loadDeckDefinition", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("uses defaults and resolves relative asset URLs", async () => {
    const deckJson = {
      data_csv: "cards.csv",
      layout_json: "layout.json",
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => deckJson,
      }),
    );
    globalThis.fetch = fetchMock;

    const path = "https://example.com/decks/test/deck.json";
    const deck = await loadDeckDefinition(path);

    expect(fetchMock).toHaveBeenCalledWith(path);
    expect(deck).toMatchObject({
      path,
      deckUrl: path,
      name: "Untitled Deck",
      version: "",
      dataCsv: "https://example.com/decks/test/cards.csv",
      layoutJson: "https://example.com/decks/test/layout.json",
      cards: null,
      layout: null,
    });
  });

  it("uses manifest metadata and resolves nested paths", async () => {
    const deckJson = {
      name: "Pocket FAC",
      version: "1.0",
      data_csv: "../cards.csv",
      layout_json: "layouts/layout.json",
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => deckJson,
      }),
    );
    globalThis.fetch = fetchMock;

    const path = "https://example.com/decks/test/deck.json";
    const deck = await loadDeckDefinition(path);

    expect(deck.name).toBe("Pocket FAC");
    expect(deck.version).toBe("1.0");
    expect(deck.dataCsv).toBe("https://example.com/decks/cards.csv");
    expect(deck.layoutJson).toBe(
      "https://example.com/decks/test/layouts/layout.json",
    );
  });

  it("throws when data_csv is missing", async () => {
    const deckJson = {
      layout_json: "layout.json",
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => deckJson,
      }),
    );
    globalThis.fetch = fetchMock;

    const path = "https://example.com/decks/test/deck.json";

    await expect(loadDeckDefinition(path)).rejects.toThrow(
      `Deck manifest at ${path} is missing or invalid required field: data_csv.`,
    );
  });

  it("throws when layout_json is missing", async () => {
    const deckJson = {
      data_csv: "cards.csv",
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => deckJson,
      }),
    );
    globalThis.fetch = fetchMock;

    const path = "https://example.com/decks/test/deck.json";

    await expect(loadDeckDefinition(path)).rejects.toThrow(
      `Deck manifest at ${path} is missing or invalid required field: layout_json.`,
    );
  });

  it("throws when required fields are invalid", async () => {
    const deckJson = {
      data_csv: " ",
      layout_json: 123,
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => deckJson,
      }),
    );
    globalThis.fetch = fetchMock;

    const path = "https://example.com/decks/test/deck.json";

    await expect(loadDeckDefinition(path)).rejects.toThrow(
      `Deck manifest at ${path} is missing or invalid required fields: data_csv, layout_json.`,
    );
  });
});
