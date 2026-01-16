import Papa from "papaparse";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ensureDeckLoaded } from "../src/deck.js";

describe("ensureDeckLoaded", () => {
  let originalPapa;
  let originalFetch;

  beforeAll(() => {
    originalPapa = window.Papa;
    window.Papa = Papa;
  });

  afterAll(() => {
    window.Papa = originalPapa;
  });

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("loads cards and layout when missing", async () => {
    const csvText = "card_id,name\n001,Alpha\n002,Beta";
    const layout = { rows: [] };
    const fetchMock = vi.fn((url) => {
      const target = String(url);
      if (target.includes("data.csv")) {
        return Promise.resolve({
          ok: true,
          text: async () => csvText,
        });
      }
      if (target.includes("layout.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => layout,
        });
      }
      return Promise.resolve({
        ok: false,
        text: async () => "",
        json: async () => ({}),
      });
    });

    globalThis.fetch = fetchMock;

    const deck = {
      dataCsv: "https://example.com/data.csv",
      layoutJson: "https://example.com/layout.json",
      cards: null,
      layout: null,
    };

    await ensureDeckLoaded(deck);

    expect(deck.cards).toHaveLength(2);
    expect(deck.layout).toEqual(layout);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws when deck has a load error", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: async () => "",
        json: async () => ({}),
      }),
    );
    globalThis.fetch = fetchMock;

    const deck = {
      dataCsv: "https://example.com/data.csv",
      layoutJson: "https://example.com/layout.json",
      cards: null,
      layout: null,
      loadError: "Deck manifest at https://example.com/deck.json is missing",
    };

    await expect(ensureDeckLoaded(deck)).rejects.toThrow(deck.loadError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not refetch when deck is already loaded", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: async () => "",
        json: async () => ({}),
      }),
    );
    globalThis.fetch = fetchMock;

    const deck = {
      dataCsv: "https://example.com/data.csv",
      layoutJson: "https://example.com/layout.json",
      cards: [{ __id: "001" }],
      layout: { rows: [] },
    };

    await ensureDeckLoaded(deck);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
