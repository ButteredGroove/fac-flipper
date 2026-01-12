const MAX_HISTORY = 10;

const elements = {
  deckList: document.getElementById("deckList"),
  deckName: document.getElementById("deckName"),
  deckVersion: document.getElementById("deckVersion"),
  deckDisplay: document.getElementById("deckDisplay"),
  cardFrame: document.getElementById("cardFrame"),
  card: document.getElementById("card"),
  previewColumn: document.getElementById("previewColumn"),
  previewFrame: document.getElementById("previewFrame"),
  previewCard: document.getElementById("previewCard"),
  clearPreview: document.getElementById("clearPreview"),
  drawButton: document.getElementById("drawButton"),
  resetButtonTop: document.getElementById("resetButtonTop"),
  reshuffleButton: document.getElementById("reshuffleButton"),
  replacementToggleSide: document.getElementById("replacementToggleSide"),
  remainingText: document.getElementById("remainingText"),
  historyList: document.getElementById("historyList"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalOk: document.getElementById("modalOk"),
  modalBody: document.querySelector(".modal-body"),
};

const state = {
  decks: [],
  currentDeck: null,
  currentCard: null,
  previewCard: null,
  history: [],
  withoutReplacement: false,
  shoe: [],
  modalOpen: false,
};

init();

function init() {
  wireEvents();
  loadDeckManifest();
}

function wireEvents() {
  elements.drawButton.addEventListener("click", drawCard);
  elements.cardFrame.addEventListener("click", drawCard);
  elements.cardFrame.addEventListener("keydown", (event) => {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      drawCard();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (isTypingTarget(event.target) || state.modalOpen) {
      return;
    }
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      drawCard();
    }
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      reshuffleDeck(false);
    }
  });

  elements.resetButtonTop.addEventListener("click", () => reshuffleDeck(true));
  elements.reshuffleButton.addEventListener("click", () =>
    reshuffleDeck(false),
  );

  elements.replacementToggleSide.addEventListener("change", (event) => {
    setReplacementMode(event.target.checked);
  });

  elements.clearPreview.addEventListener("click", clearPreview);

  elements.modalOk.addEventListener("click", closeModal);
  elements.modalOverlay.addEventListener("click", (event) => {
    if (event.target === elements.modalOverlay) {
      closeModal();
    }
  });
}

async function loadDeckManifest() {
  setDrawEnabled(false);
  try {
    const manifest = await fetchJson("decks/index.json");
    if (!Array.isArray(manifest.decks)) {
      throw new Error("Deck manifest is missing a decks array.");
    }

    const deckEntries = await Promise.all(
      manifest.decks.map((path) => loadDeckDefinition(path)),
    );

    state.decks = deckEntries;
    renderDeckList();

    if (state.decks.length > 0) {
      await selectDeck(0);
    }
  } catch (error) {
    renderDeckError(error.message);
  }
}

async function loadDeckDefinition(path) {
  const deckUrl = new URL(path, window.location.href).toString();
  const deckJson = await fetchJson(deckUrl);
  return {
    path,
    deckUrl,
    name: deckJson.name || "Untitled Deck",
    version: deckJson.version || "",
    dataCsv: new URL(deckJson.data_csv, deckUrl).toString(),
    layoutJson: new URL(deckJson.layout_json, deckUrl).toString(),
    cards: null,
    layout: null,
  };
}

async function selectDeck(index) {
  const deck = state.decks[index];
  if (!deck) {
    return;
  }

  state.currentDeck = deck;
  state.currentCard = null;
  state.history = [];
  state.previewCard = null;
  updateDeckDisplay(deck);
  highlightDeck(index);
  clearPreview();

  await ensureDeckLoaded(deck);
  const layoutMetrics = getLayoutMetrics(deck.layout);
  applyLayoutVars(elements.cardFrame, elements.card, layoutMetrics);
  applyLayoutVars(elements.previewFrame, elements.previewCard, layoutMetrics);
  resetShoe();
  renderCard();
  setDrawEnabled(true);
}

async function ensureDeckLoaded(deck) {
  if (deck.cards && deck.layout) {
    return;
  }

  const [csvText, layout] = await Promise.all([
    fetchText(deck.dataCsv),
    fetchJson(deck.layoutJson),
  ]);

  const cards = parseCards(csvText);
  deck.cards = cards;
  deck.layout = layout;
}

function updateDeckDisplay(deck) {
  elements.deckName.textContent = deck.name;
  elements.deckVersion.textContent = formatVersion(deck.version);
}

function renderDeckList() {
  elements.deckList.innerHTML = "";
  state.decks.forEach((deck, index) => {
    const item = document.createElement("li");
    item.className = "deck-item";
    item.dataset.index = String(index);
    const version = document.createElement("span");
    version.className = "deck-item-version";
    version.textContent = formatVersion(deck.version);
    const name = document.createElement("span");
    name.textContent = deck.name;
    item.appendChild(name);
    item.appendChild(version);
    item.addEventListener("click", () => {
      selectDeck(index);
    });
    elements.deckList.appendChild(item);
  });
}

function highlightDeck(index) {
  const items = elements.deckList.querySelectorAll(".deck-item");
  for (const item of items) {
    item.classList.toggle("is-active", Number(item.dataset.index) === index);
  }
}

function renderDeckError(message) {
  elements.deckList.innerHTML = "";
  const item = document.createElement("li");
  item.className = "deck-item";
  item.textContent = message;
  elements.deckList.appendChild(item);
  elements.deckName.textContent = "Deck load failed";
}

function drawCard() {
  if (
    !state.currentDeck ||
    !state.currentDeck.cards?.length ||
    state.modalOpen
  ) {
    return;
  }

  let cardIndex = 0;
  if (state.withoutReplacement) {
    if (state.shoe.length === 0) {
      resetShoe();
      openModal("Deck expended, reshuffled.");
    }
    cardIndex = state.shoe.pop();
  } else {
    cardIndex = Math.floor(Math.random() * state.currentDeck.cards.length);
  }

  const card = state.currentDeck.cards[cardIndex];
  if (!card) {
    return;
  }

  state.currentCard = card;
  addToHistory(card);
  renderCard();
  updateRemaining();
}

function reshuffleDeck(clearHistory) {
  if (!state.currentDeck) {
    return;
  }
  if (clearHistory) {
    state.history = [];
    state.currentCard = null;
    state.previewCard = null;
    renderHistory();
    renderPreviewCard();
    renderCard();
  }
  resetShoe();
  updateRemaining();
}

function resetShoe() {
  const cards = state.currentDeck?.cards || [];
  if (state.withoutReplacement && cards.length > 0) {
    state.shoe = shuffle(Array.from({ length: cards.length }, (_, i) => i));
  } else {
    state.shoe = [];
  }
  updateRemaining();
}

function setReplacementMode(withoutReplacement) {
  state.withoutReplacement = withoutReplacement;
  elements.replacementToggleSide.checked = withoutReplacement;
  resetShoe();
  updateRemaining();
}

function updateRemaining() {
  if (state.withoutReplacement) {
    const remaining = state.shoe.length;
    const text = `(${remaining} remaining)`;
    elements.remainingText.textContent = text;
    elements.remainingText.style.display = "block";
  } else {
    elements.remainingText.textContent = "";
    elements.remainingText.style.display = "none";
  }
}

function addToHistory(card) {
  const entry = {
    id: card.__id,
    time: formatTime(new Date()),
    card,
  };
  state.history.unshift(entry);
  if (state.history.length > MAX_HISTORY) {
    state.history.pop();
  }
  renderHistory();
  renderPreviewCard();
}

function setPreviewCard(card) {
  state.previewCard = card;
  renderPreviewCard();
  renderHistory();
}

function clearPreview() {
  state.previewCard = null;
  renderPreviewCard();
  renderHistory();
}

function renderHistory() {
  elements.historyList.innerHTML = "";

  if (state.history.length === 0) {
    const emptyList = document.createElement("div");
    emptyList.className = "muted";
    emptyList.textContent = "No draws yet";
    elements.historyList.appendChild(emptyList);
    return;
  }

  const activeId = state.previewCard?.__id;

  state.history.forEach((entry, index) => {
    const isActive = activeId ? entry.id === activeId : index === 0;
    const row = document.createElement("button");
    row.type = "button";
    row.className = `history-item${isActive ? " is-active" : ""}`;
    row.addEventListener("click", () => {
      setPreviewCard(entry.card);
    });
    const id = document.createElement("strong");
    id.textContent = entry.id;
    const time = document.createElement("span");
    time.textContent = entry.time;
    row.appendChild(id);
    row.appendChild(time);
    elements.historyList.appendChild(row);
  });
}

function renderCard() {
  const deck = state.currentDeck;
  if (!deck?.layout) {
    return;
  }
  renderCardView(
    elements.cardFrame,
    elements.card,
    deck.layout,
    state.currentCard,
    "Draw a card to begin",
  );
}

function renderPreviewCard() {
  const showPreview = Boolean(state.previewCard) || state.history.length > 0;
  elements.previewColumn.hidden = !showPreview;
  if (!showPreview) {
    elements.previewCard.innerHTML = "";
    return;
  }
  const deck = state.currentDeck;
  if (!deck?.layout) {
    elements.previewCard.innerHTML = "";
    return;
  }
  renderCardView(
    elements.previewFrame,
    elements.previewCard,
    deck.layout,
    state.previewCard,
    "Select a previous draw",
  );
}

function getLayoutMetrics(layout) {
  const cols = layout.card?.grid?.cols || 12;
  const rows = layout.card?.grid?.rows || 16;
  const width = Number(layout.card?.size?.width);
  const textScaleValue = Number(layout.card?.text_scale);
  const hasWidth = Number.isFinite(width) && width > 0;
  const hasTextScale = Number.isFinite(textScaleValue) && textScaleValue > 0;
  return {
    cols,
    rows,
    width,
    hasWidth,
    textScale: hasTextScale ? textScaleValue : 1,
    hasTextScale,
  };
}

function applyLayoutVars(frameEl, cardEl, metrics) {
  frameEl.style.setProperty("--card-cols", metrics.cols);
  frameEl.style.setProperty("--card-rows", metrics.rows);
  cardEl.style.setProperty("--card-cols", metrics.cols);
  cardEl.style.setProperty("--card-rows", metrics.rows);
  if (metrics.hasWidth) {
    frameEl.style.setProperty("--card-width", `${metrics.width}px`);
  } else {
    frameEl.style.removeProperty("--card-width");
  }
  if (metrics.hasTextScale) {
    frameEl.style.setProperty("--card-text-scale", metrics.textScale);
  } else {
    frameEl.style.removeProperty("--card-text-scale");
  }
}

function renderCardView(frameEl, cardEl, layout, card, placeholderText) {
  const metrics = getLayoutMetrics(layout);
  applyLayoutVars(frameEl, cardEl, metrics);

  cardEl.innerHTML = "";

  if (!card) {
    const placeholder = document.createElement("div");
    placeholder.className = "card-placeholder";
    placeholder.textContent = placeholderText;
    cardEl.appendChild(placeholder);
    return;
  }

  const blocks = Array.isArray(layout.blocks) ? [...layout.blocks] : [];
  blocks.sort((a, b) => a.y - b.y || a.x - b.x);

  for (const block of blocks) {
    const blockEl = document.createElement("div");
    blockEl.className = "card-block";
    blockEl.style.gridColumn = `${block.x} / span ${block.w}`;
    blockEl.style.gridRow = `${block.y} / span ${block.h}`;

    if (block.styles?.fontSize) {
      blockEl.style.fontSize = `${block.styles.fontSize * metrics.textScale}px`;
    }

    if (block.title) {
      const title = document.createElement("div");
      title.className = "block-title";
      title.textContent = block.title;
      blockEl.appendChild(title);
    }

    if (block.type === "kv") {
      const list = document.createElement("div");
      list.className = "kv-list";
      for (const item of block.items || []) {
        const value = getValue(card[item.field]);
        const row = document.createElement("div");
        const hasLabel = Boolean(item.label);
        row.className = `kv-item${hasLabel ? "" : " kv-item--solo"}`;
        if (hasLabel) {
          const label = document.createElement("span");
          label.className = "kv-label";
          label.textContent = item.label;
          row.appendChild(label);
        }
        const val = document.createElement("span");
        val.className = "kv-value";
        val.textContent = value;
        applyValueStyles(value, item.styles, val);
        row.appendChild(val);
        list.appendChild(row);
      }
      blockEl.appendChild(list);
    }

    if (block.type === "table") {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      const table = document.createElement("table");
      table.className = "card-table";

      const head = document.createElement("thead");
      const headRow = document.createElement("tr");
      const emptyHead = document.createElement("th");
      headRow.appendChild(emptyHead);

      for (const column of block.columns || []) {
        const th = document.createElement("th");
        const headerText = column.header || "";
        th.textContent = headerText;
        applyValueStyles(headerText, column.headerStyles, th);
        headRow.appendChild(th);
      }

      head.appendChild(headRow);
      table.appendChild(head);

      const body = document.createElement("tbody");
      for (const rowKey of block.rows || []) {
        const tr = document.createElement("tr");
        const rowLabel = document.createElement("th");
        rowLabel.textContent = rowKey;
        tr.appendChild(rowLabel);

        for (const column of block.columns || []) {
          const td = document.createElement("td");
          const cellValue = getTableValue(card, column.field_prefix, rowKey);
          td.textContent = cellValue;
          applyValueStyles(cellValue, column.styles, td);
          tr.appendChild(td);
        }
        body.appendChild(tr);
      }

      table.appendChild(body);
      wrap.appendChild(table);
      blockEl.appendChild(wrap);
    }

    cardEl.appendChild(blockEl);
  }
}

function getTableValue(card, prefix, rowKey) {
  if (!prefix) {
    return "";
  }
  const rowValue = getValue(card[`${prefix}${rowKey}`]);
  if (rowValue) {
    return rowValue;
  }
  return getValue(card[`${prefix}all`]);
}

function getValue(value) {
  if (value === undefined || value === null) {
    return "";
  }
  const trimmed = String(value).trim();
  return trimmed;
}

function applyValueStyles(value, styles, element) {
  if (!styles || !element) {
    return;
  }
  const text = getValue(value);
  if (!text) {
    return;
  }
  if (styles.color) {
    element.style.color = styles.color;
  }
  const rules = Array.isArray(styles.colorRules) ? styles.colorRules : [];
  for (const rule of rules) {
    if (rule.match && text === rule.match) {
      element.style.color = rule.color;
      break;
    }
    if (rule.prefix && text.startsWith(rule.prefix)) {
      element.style.color = rule.color;
      break;
    }
    if (rule.regex) {
      try {
        const regex = new RegExp(rule.regex);
        if (regex.test(text)) {
          element.style.color = rule.color;
          break;
        }
      } catch {
        // Ignore invalid regex rules.
      }
    }
  }
}

function parseCards(csvText) {
  const result = Papa.parse(csvText, { skipEmptyLines: "greedy" });
  if (result.errors?.length) {
    console.warn("CSV parse errors:", result.errors);
  }
  const rows = Array.isArray(result.data) ? result.data : [];
  if (rows.length === 0) {
    return [];
  }
  const headers = rows[0].map((header) => String(header ?? "").trim());
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row, index) => {
      const card = {};
      headers.forEach((header, i) => {
        card[header] = row[i] ?? "";
      });
      const id = card.card_id ? String(card.card_id).trim() : "";
      card.__id = id || String(index + 1).padStart(3, "0");
      return card;
    });
}

function shuffle(list) {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatVersion(version) {
  if (!version) {
    return "";
  }
  return version.startsWith("v") ? version : `v${version}`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isTypingTarget(target) {
  if (!target) {
    return false;
  }
  const tagName = target.tagName?.toLowerCase();
  return (
    tagName === "input" || tagName === "textarea" || target.isContentEditable
  );
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.text();
}

function openModal(message) {
  elements.modalBody.textContent = message;
  elements.modalOverlay.hidden = false;
  state.modalOpen = true;
  elements.modalOk.focus();
}

function closeModal() {
  elements.modalOverlay.hidden = true;
  state.modalOpen = false;
}

function setDrawEnabled(enabled) {
  elements.drawButton.disabled = !enabled;
}
