import { readFileSync } from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ensureDeckLoaded } from "../src/deck.js";

const manifest = JSON.parse(readFileSync("decks/index.json", "utf8"));

describe("shipped deck integrity", () => {
  let originalPapa;

  beforeAll(() => {
    originalPapa = window.Papa;
    window.Papa = Papa;
  });

  afterAll(() => {
    window.Papa = originalPapa;
    vi.unstubAllGlobals();
  });

  it("lists distinct deck definitions", () => {
    expect(Array.isArray(manifest.decks)).toBe(true);
    expect(manifest.decks.length).toBeGreaterThan(0);
    expect(new Set(manifest.decks).size).toBe(manifest.decks.length);
  });

  it.each(manifest.decks)(
    "loads cards and layout for %s",
    async (manifestPath) => {
      const definition = JSON.parse(readFileSync(manifestPath, "utf8"));
      expect(definition.data_csv).toEqual(expect.any(String));
      expect(definition.layout_json).toEqual(expect.any(String));
      const base = path.dirname(manifestPath);
      const deck = {
        dataCsv: path.join(base, definition.data_csv),
        layoutJson: path.join(base, definition.layout_json),
        cards: null,
        layout: null,
      };
      vi.stubGlobal("fetch", async (file) => {
        const content = readFileSync(file, "utf8");
        return {
          ok: true,
          text: async () => content,
          json: async () => JSON.parse(content),
        };
      });

      await ensureDeckLoaded(deck);

      expect(deck.cards.length).toBeGreaterThan(0);
      expect(deck.parseWarnings).toEqual([]);
      expect(Array.isArray(deck.layout.blocks)).toBe(true);
      expect(deck.layout.blocks.length).toBeGreaterThan(0);
    },
  );
});
