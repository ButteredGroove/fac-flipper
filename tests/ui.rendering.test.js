import { afterEach, describe, expect, it } from "vitest";
import { renderCardView } from "../src/ui.js";

describe("card table rendering", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("resolves table values and applies color rules", () => {
    const frameEl = document.createElement("div");
    const cardEl = document.createElement("div");
    document.body.append(frameEl, cardEl);

    const layout = {
      card: { grid: { cols: 12, rows: 16 } },
      blocks: [
        {
          type: "table",
          x: 1,
          y: 1,
          w: 12,
          h: 6,
          rows: ["A", "B", "C"],
          columns: [
            {
              header: "H",
              field_prefix: "stat_",
              headerStyles: {
                color: "#222222",
                colorRules: [{ match: "H", color: "#123456" }],
              },
              styles: {
                color: "#111111",
                colorRules: [
                  { regex: "[", color: "#f0f0f0" },
                  { match: "10", color: "#ff0000" },
                  { prefix: "SP:", color: "#00ff00" },
                  { regex: "^B", color: "#0000ff" },
                ],
              },
            },
            {
              header: "X",
              field_prefix: "misc_",
              styles: {
                color: "#888888",
                colorRules: [{ regex: "[", color: "#ff00ff" }],
              },
            },
          ],
        },
      ],
    };

    const card = {
      stat_A: "10",
      stat_B: "B2",
      stat_all: "SP:1",
      misc_A: "Maybe",
    };

    renderCardView(frameEl, cardEl, layout, card, "Placeholder");

    const table = cardEl.querySelector("table.card-table");
    expect(table).not.toBeNull();

    const headers = table.querySelectorAll("thead th");
    expect(headers[1].textContent).toBe("H");
    expect(headers[1].style.color).toBe("rgb(18, 52, 86)");

    const rows = table.querySelectorAll("tbody tr");
    const rowA = rows[0].querySelectorAll("td");
    const rowB = rows[1].querySelectorAll("td");
    const rowC = rows[2].querySelectorAll("td");

    expect(rowA[0].textContent).toBe("10");
    expect(rowA[0].style.color).toBe("rgb(255, 0, 0)");
    expect(rowA[1].textContent).toBe("Maybe");
    expect(rowA[1].style.color).toBe("rgb(136, 136, 136)");

    expect(rowB[0].textContent).toBe("B2");
    expect(rowB[0].style.color).toBe("rgb(0, 0, 255)");

    expect(rowC[0].textContent).toBe("SP:1");
    expect(rowC[0].style.color).toBe("rgb(0, 255, 0)");
  });
});
