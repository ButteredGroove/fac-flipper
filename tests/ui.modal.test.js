import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APP_AUTHOR,
  APP_ISSUES_URL,
  APP_NAME,
  APP_SHORTCUTS,
  APP_VERSION,
} from "../src/config.js";
import { formatVersion } from "../src/utils.js";

const fixture = `
  <div id="modalOverlay" class="modal-overlay" hidden>
    <div id="modal" class="modal">
      <div id="modalTitle" class="modal-title"></div>
      <div id="modalBody" class="modal-body"></div>
      <button id="modalOk" type="button">OK</button>
    </div>
  </div>
`;

async function setupUi() {
  document.body.innerHTML = fixture;
  vi.resetModules();
  const ui = await import("../src/ui.js");
  const stateModule = await import("../src/state.js");
  return { ...ui, state: stateModule.state };
}

function findAboutRow(label) {
  return [...document.querySelectorAll(".about-row")].find(
    (row) => row.querySelector(".about-label")?.textContent === label,
  );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("modal UI", () => {
  it("renders a default modal from a string", async () => {
    const { openModal, state } = await setupUi();

    openModal("Hello there");

    expect(document.getElementById("modalTitle").textContent).toBe("Notice");
    expect(document.getElementById("modalBody").textContent).toBe(
      "Hello there",
    );
    expect(document.getElementById("modalOk").textContent).toBe("OK");
    expect(document.getElementById("modalOverlay").hidden).toBe(false);
    expect(
      document.getElementById("modal").classList.contains("is-about"),
    ).toBe(false);
    expect(state.modalOpen).toBe(true);
  });

  it("renders a custom modal from options", async () => {
    const { openModal } = await setupUi();

    openModal({
      title: "Heads up",
      body: "Custom body",
      confirmLabel: "Close",
      variant: "about",
    });

    expect(document.getElementById("modalTitle").textContent).toBe("Heads up");
    expect(document.getElementById("modalBody").textContent).toBe(
      "Custom body",
    );
    expect(document.getElementById("modalOk").textContent).toBe("Close");
    expect(
      document.getElementById("modal").classList.contains("is-about"),
    ).toBe(true);
  });

  it("renders node content when provided", async () => {
    const { openModal } = await setupUi();
    const node = document.createElement("div");
    node.textContent = "Node body";

    openModal({ bodyNodes: node, confirmLabel: "Dismiss" });

    expect(document.getElementById("modalBody").textContent).toBe("Node body");
    expect(document.getElementById("modalOk").textContent).toBe("Dismiss");
  });

  it("renders About modal content", async () => {
    const { openAboutModal, state } = await setupUi();

    openAboutModal();

    expect(document.getElementById("modalTitle").textContent).toBe("About");
    expect(document.getElementById("modalOk").textContent).toBe("Close");
    expect(document.getElementById("modalOverlay").hidden).toBe(false);
    expect(
      document.getElementById("modal").classList.contains("is-about"),
    ).toBe(true);
    expect(state.modalOpen).toBe(true);

    const appRow = findAboutRow("App");
    const expectedApp = `${APP_NAME} ${formatVersion(APP_VERSION)}`;
    expect(appRow?.querySelector(".about-value")?.textContent).toBe(
      expectedApp,
    );

    const creatorRow = findAboutRow("Creator");
    expect(creatorRow?.querySelector(".about-value")?.textContent).toBe(
      APP_AUTHOR,
    );

    const issuesRow = findAboutRow("Suggestions & bugs");
    const issuesLink = issuesRow?.querySelector("a");
    expect(issuesLink?.textContent).toBe("Go here");
    expect(issuesLink?.getAttribute("href")).toBe(APP_ISSUES_URL);
    expect(issuesLink?.getAttribute("target")).toBe("_blank");
    expect(issuesLink?.getAttribute("rel")).toBe("noreferrer");

    const shortcutsRow = findAboutRow("Shortcuts");
    expect(shortcutsRow?.querySelector(".about-value")?.textContent).toBe(
      APP_SHORTCUTS,
    );
  });
});
