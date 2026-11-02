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
