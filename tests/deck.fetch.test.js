import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJson, fetchText } from "../src/deck.js";

describe("fetchJson", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns JSON when response is ok", async () => {
    const payload = { ok: true };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => payload,
      }),
    );
    globalThis.fetch = fetchMock;

    await expect(fetchJson("https://example.com/data.json")).resolves.toEqual(
      payload,
    );
  });

  it("throws when response is not ok", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({}),
      }),
    );
    globalThis.fetch = fetchMock;

    await expect(fetchJson("https://example.com/data.json")).rejects.toThrow(
      "Failed to load https://example.com/data.json",
    );
  });
});

describe("fetchText", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns text when response is ok", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: async () => "hello",
      }),
    );
    globalThis.fetch = fetchMock;

    await expect(fetchText("https://example.com/data.txt")).resolves.toBe(
      "hello",
    );
  });

  it("throws when response is not ok", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        text: async () => "",
      }),
    );
    globalThis.fetch = fetchMock;

    await expect(fetchText("https://example.com/data.txt")).rejects.toThrow(
      "Failed to load https://example.com/data.txt",
    );
  });
});
