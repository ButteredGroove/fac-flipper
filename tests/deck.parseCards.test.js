import Papa from "papaparse";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { parseCards, shuffle } from "../src/deck.js";

describe("parseCards", () => {
  let originalPapa;

  beforeAll(() => {
    originalPapa = window.Papa;
    window.Papa = Papa;
  });

  afterAll(() => {
    window.Papa = originalPapa;
  });

  it("parses CSV rows into card objects", () => {
    const csv = "card_id,name,notes\nA1,Alpha,First\nB2,Beta,Second";
    const cards = parseCards(csv);

    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({
      card_id: "A1",
      name: "Alpha",
      notes: "First",
      __id: "A1",
    });
    expect(cards[1]).toMatchObject({
      card_id: "B2",
      name: "Beta",
      notes: "Second",
      __id: "B2",
    });
  });

  it("skips empty or whitespace-only rows", () => {
    const csv = "card_id,name\nA1,Alpha\n,\n  ,   \nB2,Beta";
    const cards = parseCards(csv);

    expect(cards.map((card) => card.name)).toEqual(["Alpha", "Beta"]);
  });

  it("uses card_id when present and falls back to a padded index", () => {
    const csv = "card_id,name\n  007  ,Bond\n,NoId";
    const cards = parseCards(csv);

    expect(cards[0].__id).toBe("007");
    expect(cards[1].__id).toBe("002");
  });

  it("trims headers and fills missing cells with empty strings", () => {
    const csv = " card_id , ,name\n001,,Alpha\n002";
    const cards = parseCards(csv);

    expect(cards).toHaveLength(2);
    expect(cards[0].card_id).toBe("001");
    expect(cards[0][""]).toBe("");
    expect(cards[0].name).toBe("Alpha");
    expect(cards[1].card_id).toBe("002");
    expect(cards[1][""]).toBe("");
    expect(cards[1].name).toBe("");
  });

  it("throws when PapaParse is unavailable", () => {
    const previousPapa = window.Papa;
    window.Papa = undefined;

    try {
      expect(() => parseCards("card_id,name\n001,Alpha")).toThrow(
        "PapaParse is not available.",
      );
    } finally {
      window.Papa = previousPapa;
    }
  });

  it("warns when PapaParse reports errors", () => {
    const originalPapa = window.Papa;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    window.Papa = {
      parse: () => ({
        data: [["card_id"], ["001"]],
        errors: [{ type: "Quotes", code: "MissingQuotes", row: 1 }],
      }),
    };

    try {
      parseCards("card_id\n001");
      expect(warnSpy).toHaveBeenCalledWith(
        "CSV parse errors:",
        expect.arrayContaining([
          expect.objectContaining({ type: "Quotes", code: "MissingQuotes" }),
        ]),
      );
    } finally {
      window.Papa = originalPapa;
      warnSpy.mockRestore();
    }
  });
});

describe("shuffle", () => {
  it("returns a new array with the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);

    expect(result).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });
});
