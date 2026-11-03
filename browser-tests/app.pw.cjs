const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.route("**/gc.zgo.at/**", (route) => route.abort());
});

test("loads all decks, draws, previews, resets, and remembers a deck", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#drawButton")).toBeEnabled();
  const decks = page.locator(".deck-item");
  await expect(decks).toHaveCount(4);

  for (let i = 0; i < 4; i += 1) {
    await decks.nth(i).click();
    await expect(page.locator(".deck-item.is-active")).toHaveAttribute(
      "data-index",
      String(i),
    );
    await expect(page.locator("#drawButton")).toBeEnabled();
    await page.locator("#drawButton").click();
    await expect(page.locator(".history-item")).toHaveCount(1);
    await page.locator(".history-item").click();
    await expect(page.locator("#previewColumn")).toBeVisible();
    await page.locator("#resetButtonTop").click();
    await page.locator("#modalOk").click();
    await expect(page.locator(".history-item")).toHaveCount(0);
  }

  const selectedDeck = await page.locator("#deckName").textContent();
  await page.reload();
  await expect(page.locator("#drawButton")).toBeEnabled();
  await expect(page.locator("#deckName")).toHaveText(selectedDeck);
});

test("draws without replacement and reshuffles without clearing history", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#drawButton")).toBeEnabled();
  await page.locator(".switch .slider").click();
  const before = await page.locator("#remainingText").textContent();
  await page.locator("#drawButton").click();
  const after = await page.locator("#remainingText").textContent();
  expect(Number(after.match(/\d+/)[0])).toBe(
    Number(before.match(/\d+/)[0]) - 1,
  );
  await page.locator("#reshuffleButton").click();
  await page.locator("#modalOk").click();
  await expect(page.locator(".history-item")).toHaveCount(1);
});

test("flashes a stationary card and accepts rapid draws", async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("fac-flipper:drawAnimation", "opaque"),
  );
  await page.goto("/");
  await expect(page.locator("#drawButton")).toBeEnabled();
  const result = await page.evaluate(() => {
    const card = document.querySelector("#card");
    const before = card.getBoundingClientRect();
    document.querySelector("#drawButton").click();
    const animations = document.getAnimations();
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = 190;
    }
    const flash = animations.find(
      (animation) => animation.animationName === "cardSurfaceTint",
    );
    if (!flash) return null;
    flash.currentTime = 0;
    const start = Number(getComputedStyle(card, "::before").opacity);
    flash.currentTime = 150;
    const peak = Number(getComputedStyle(card, "::before").opacity);
    const flashColor = getComputedStyle(card, "::before").backgroundColor;
    const buttonColor = getComputedStyle(
      document.querySelector("#drawButton"),
    ).backgroundColor;
    flash.currentTime = 300;
    const held = Number(getComputedStyle(card, "::before").opacity);
    flash.currentTime = 600;
    const fading = Number(getComputedStyle(card, "::before").opacity);
    const during = card.getBoundingClientRect();
    document.querySelector("#drawButton").click();
    const restarted = Number(getComputedStyle(card, "::before").opacity);
    return {
      start,
      peak,
      held,
      fading,
      restarted,
      flashColor,
      buttonColor,
      before: [before.x, before.y, before.width, before.height],
      during: [during.x, during.y, during.width, during.height],
    };
  });
  expect(result).not.toBeNull();
  expect(result.start).toBe(1);
  expect(result.peak).toBe(1);
  expect(result.held).toBe(1);
  expect(result.fading).toBeLessThan(1);
  expect(result.restarted).toBe(1);
  expect(result.flashColor).toBe(result.buttonColor);
  expect(result.during).toEqual(result.before);
  await expect(page.locator(".history-item")).toHaveCount(2);
});

for (const motion of ["reduce", "no-preference"]) {
  test(`provides a translucent cue with system motion ${motion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/");
    await expect(page.locator("#drawButton")).toBeEnabled();
    const cue = await page.evaluate(() => {
      document.querySelector("#drawButton").click();
      const card = document.querySelector("#card");
      const overlay = getComputedStyle(card, "::before");
      return {
        tint: Number(overlay.opacity),
        flash: overlay.animationName,
        card: getComputedStyle(card).animationName,
      };
    });
    expect(cue.tint).toBeGreaterThan(0);
    expect(cue.flash).toBe("none");
    expect(cue.card).toBe("none");
  });
}

test("lets the user choose an opaque or translucent flash and remembers it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#drawButton")).toBeEnabled();
  await page.locator("#settingsButton").click();
  const setting = page.getByLabel("Draw animation");
  await expect(setting).toHaveValue("translucent");
  await setting.selectOption("opaque");
  await page.locator("#modalOk").click();
  await page.reload();
  await expect(page.locator("#drawButton")).toBeEnabled();
  await page.locator("#settingsButton").click();
  await expect(setting).toHaveValue("opaque");
  await page.evaluate(() => {
    document.querySelector("#drawAnimation").value = "translucent";
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    );
  });
  await expect(setting).toHaveValue("opaque");
  await page.locator("#modalOk").click();
  const full = await page.evaluate(() => {
    document.querySelector("#drawButton").click();
    return {
      animation: getComputedStyle(document.querySelector("#card"), "::before")
        .animationName,
      opacity: Number(
        getComputedStyle(document.querySelector("#card"), "::before").opacity,
      ),
    };
  });
  expect(full.animation).toBe("cardSurfaceTint");
  expect(full.opacity).toBe(1);

  await page.locator("#settingsButton").click();
  await setting.selectOption("translucent");
  await page.locator("#modalOk").click();
  const system = await page.evaluate(() => {
    document.querySelector("#drawButton").click();
    return {
      animation: getComputedStyle(document.querySelector("#card"), "::before")
        .animationName,
      opacity: Number(
        getComputedStyle(document.querySelector("#card"), "::before").opacity,
      ),
    };
  });
  expect(system.animation).toBe("none");
  expect(system.opacity).toBe(0.14);
  await page.reload();
  await page.locator("#settingsButton").click();
  await expect(setting).toHaveValue("translucent");
});

test("applies the selected animation for the session when storage is blocked", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("#drawButton")).toBeEnabled();
  await page.locator("#settingsButton").click();
  const setting = page.getByLabel("Draw animation");
  await expect(setting).toHaveValue("translucent");
  await setting.selectOption("opaque");
  await expect(page.locator("html")).toHaveAttribute(
    "data-draw-animation",
    "opaque",
  );
  await page.locator("#modalOk").click();
  await page.reload();
  await page.locator("#settingsButton").click();
  await expect(setting).toHaveValue("translucent");
});

test("preserves the previously selected full flash as opaque", async ({
  page,
}) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("fac-flipper:drawAnimation", "full"),
  );
  await page.goto("/");
  await page.locator("#settingsButton").click();
  await expect(page.getByLabel("Draw animation")).toHaveValue("opaque");
});

test("opens settings with the keyboard and returns focus on close", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#settingsButton").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await expect(page.getByLabel("Draw animation")).toBeFocused();
  await expect(page.locator("#modalCancel")).toBeHidden();
  await page.keyboard.press("Tab");
  await expect(page.locator("#modalOk")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#settingsButton")).toBeFocused();
});

test("keeps the replacement switch in sync after reload and page restoration", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#drawButton")).toBeEnabled();
  const toggle = page.locator("#replacementToggleSide");
  const remaining = page.locator("#remainingText");
  await page.locator(".switch .slider").click();
  await page.locator("#drawButton").click();
  await expect(toggle).toBeChecked();
  await expect(remaining).toBeVisible();

  await page.reload();
  await expect(page.locator("#drawButton")).toBeEnabled();
  await expect(toggle).not.toBeChecked();
  await expect(remaining).toBeHidden();
  await page.evaluate(() => {
    document.querySelector("#replacementToggleSide").checked = true;
    window.dispatchEvent(new PageTransitionEvent("pageshow"));
  });
  await expect(toggle).not.toBeChecked();

  await page.locator(".switch .slider").click();
  const fullCount = Number((await remaining.textContent()).match(/\d+/)[0]);
  await page.locator("#drawButton").click();
  const drawnCount = Number((await remaining.textContent()).match(/\d+/)[0]);
  expect(drawnCount).toBe(fullCount - 1);
  await page.evaluate(() => {
    document.querySelector("#replacementToggleSide").checked = false;
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    );
  });
  await expect(toggle).toBeChecked();
  await expect(remaining).toHaveText(`(${drawnCount} remaining)`);
  await page.locator("#drawButton").click();
  await expect(remaining).toHaveText(`(${drawnCount - 1} remaining)`);
});

test("keeps dialog focus contained and restores it after Escape", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#drawButton")).toBeEnabled();
  await page.locator("#drawButton").click();
  await page.locator("#resetButtonTop").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#modalCancel")).toBeFocused();
  expect(await page.locator(".app").evaluate((element) => element.inert)).toBe(
    true,
  );
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#modalOk")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#modalCancel")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#modalOverlay")).toBeHidden();
  await expect(page.locator("#resetButtonTop")).toBeFocused();
  await expect(page.locator(".history-item")).toHaveCount(1);
});

test("loads another deck when earlier card files fail", async ({ page }) => {
  await page.route("**/decks/SP4ED_NO_STEAL/cards.csv", (route) =>
    route.fulfill({ status: 503 }),
  );
  await page.route("**/decks/SP4ED/cards.csv", (route) =>
    route.fulfill({ status: 503 }),
  );
  await page.goto("/");
  await expect(page.locator("#drawButton")).toBeEnabled();
  await expect(page.locator(".deck-item.is-active")).toHaveAttribute(
    "data-index",
    "2",
  );
  await page.locator("#drawButton").click();
  await expect(page.locator(".history-item")).toHaveCount(1);
});

test("shows an actionable error for malformed deck data", async ({ page }) => {
  await page.route("**/decks/index.json", (route) =>
    route.fulfill({ json: { decks: ["decks/SPADV/deck.json"] } }),
  );
  await page.route("**/decks/SPADV/cards.csv", (route) =>
    route.fulfill({ status: 200, body: "id,name\n001" }),
  );
  await page.goto("/");
  await expect(page.locator(".card-error")).toContainText("expected 2");
  await expect(page.locator("#drawButton")).toBeDisabled();
});
