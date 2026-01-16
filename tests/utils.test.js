import { describe, expect, it, vi } from "vitest";
import {
  formatTime,
  formatVersion,
  getValue,
  isTypingTarget,
} from "../src/utils.js";

describe("utils", () => {
  it("formats versions with a leading v when needed", () => {
    expect(formatVersion("")).toBe("");
    expect(formatVersion(null)).toBe("");
    expect(formatVersion(2024)).toBe("v2024");
    expect(formatVersion("1.2.3")).toBe("v1.2.3");
    expect(formatVersion("v1.2.3")).toBe("v1.2.3");
  });

  it("normalizes values safely", () => {
    expect(getValue(null)).toBe("");
    expect(getValue(undefined)).toBe("");
    expect(getValue("  test  ")).toBe("test");
    expect(getValue(42)).toBe("42");
  });

  it("detects typing targets and interactive elements", () => {
    const input = document.createElement("input");
    expect(isTypingTarget(input)).toBe(true);

    const editable = document.createElement("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(isTypingTarget(editable)).toBe(true);

    const link = document.createElement("a");
    link.setAttribute("href", "#");
    expect(isTypingTarget(link)).toBe(true);

    const buttonWrapper = document.createElement("div");
    buttonWrapper.setAttribute("role", "button");
    const buttonChild = document.createElement("span");
    buttonWrapper.appendChild(buttonChild);
    expect(isTypingTarget(buttonChild)).toBe(true);

    const plain = document.createElement("div");
    expect(isTypingTarget(plain)).toBe(false);
  });

  it("formats time using the expected options", () => {
    const date = {
      toLocaleTimeString: vi.fn(() => "1:23 PM"),
    };

    const result = formatTime(date);

    expect(result).toBe("1:23 PM");
    expect(date.toLocaleTimeString).toHaveBeenCalledWith([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  });
});
