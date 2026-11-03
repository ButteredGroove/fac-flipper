import { describe, expect, it, vi } from "vitest";
import {
  clearLastDeckPath,
  getDrawAnimationPreference,
  getLastDeckPath,
  setDrawAnimationPreference,
  setLastDeckPath,
} from "../src/preferences.js";

const LAST_DECK_PATH_KEY = "fac-flipper:lastDeckPath";
const DRAW_ANIMATION_KEY = "fac-flipper:drawAnimation";

describe("preferences storage helpers", () => {
  it("defaults invalid or unavailable animation preferences to translucent", () => {
    window.localStorage.removeItem(DRAW_ANIMATION_KEY);
    expect(getDrawAnimationPreference()).toBe("translucent");
    window.localStorage.setItem(DRAW_ANIMATION_KEY, "invalid");
    expect(getDrawAnimationPreference()).toBe("translucent");
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Blocked");
      });
    expect(getDrawAnimationPreference()).toBe("translucent");
    spy.mockRestore();
    window.localStorage.removeItem(DRAW_ANIMATION_KEY);
  });

  it("persists valid animation preferences and ignores invalid values", () => {
    setDrawAnimationPreference("opaque");
    expect(getDrawAnimationPreference()).toBe("opaque");
    setDrawAnimationPreference("invalid");
    expect(getDrawAnimationPreference()).toBe("opaque");
    setDrawAnimationPreference("translucent");
    expect(getDrawAnimationPreference()).toBe("translucent");
    window.localStorage.removeItem(DRAW_ANIMATION_KEY);
  });

  it("preserves the previously selected full flash", () => {
    window.localStorage.setItem(DRAW_ANIMATION_KEY, "full");
    expect(getDrawAnimationPreference()).toBe("opaque");
    window.localStorage.removeItem(DRAW_ANIMATION_KEY);
  });

  it("tolerates unavailable storage when saving animation preferences", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Blocked");
      });
    expect(() => setDrawAnimationPreference("opaque")).not.toThrow();
    spy.mockRestore();
  });

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
    const path = "decks/SPADV/deck.json";
    setLastDeckPath(path);
    expect(window.localStorage.getItem(LAST_DECK_PATH_KEY)).toBe(path);
    clearLastDeckPath();
    expect(window.localStorage.getItem(LAST_DECK_PATH_KEY)).toBeNull();
  });
});
