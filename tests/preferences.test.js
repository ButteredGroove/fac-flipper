import { describe, expect, it, vi } from "vitest";
import {
  LAST_DECK_PATH_KEY,
  clearLastDeckPath,
  getLastDeckPath,
  setLastDeckPath,
} from "../src/preferences.js";

describe("preferences storage helpers", () => {
  it("returns null when storage read fails", () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Blocked");
      });

    expect(getLastDeckPath()).toBeNull();

    getItemSpy.mockRestore();
  });

  it("ignores invalid paths and storage write failures", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Blocked");
      });

    expect(() => setLastDeckPath("")).not.toThrow();
    expect(() => setLastDeckPath("decks/SPADV/deck.json")).not.toThrow();

    setItemSpy.mockRestore();
  });

  it("ignores storage clear failures", () => {
    const removeItemSpy = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("Blocked");
      });

    expect(() => clearLastDeckPath()).not.toThrow();

    removeItemSpy.mockRestore();
  });

  it("uses the expected storage key", () => {
    expect(LAST_DECK_PATH_KEY).toBe("fac-flipper:lastDeckPath");
  });
});
