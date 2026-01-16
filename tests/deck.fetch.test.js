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

  it("throws with status details when response is not ok", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({}),
      }),
    );
    globalThis.fetch = fetchMock;

    await expect(fetchJson("https://example.com/data.json")).rejects.toThrow(
      "Failed to load https://example.com/data.json (HTTP 404 Not Found)",
    );
  });

  it("throws a network error when fetch rejects", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("Connection lost")));
    globalThis.fetch = fetchMock;

    await expect(fetchJson("https://example.com/data.json")).rejects.toThrow(
      "Network error while loading https://example.com/data.json: Connection lost",
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

  it("throws with status details when response is not ok", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Server Error",
        text: async () => "",
      }),
    );
    globalThis.fetch = fetchMock;

    await expect(fetchText("https://example.com/data.txt")).rejects.toThrow(
      "Failed to load https://example.com/data.txt (HTTP 500 Server Error)",
    );
  });

  it("throws a network error when fetch rejects", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("Socket hang up")));
    globalThis.fetch = fetchMock;

    await expect(fetchText("https://example.com/data.txt")).rejects.toThrow(
      "Network error while loading https://example.com/data.txt: Socket hang up",
    );
  });
});
