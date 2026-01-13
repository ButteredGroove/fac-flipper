import {
  APP_AUTHOR,
  APP_ISSUES_URL,
  APP_NAME,
  APP_SHORTCUTS,
  APP_VERSION,
} from "./config.js";
import { elements, state } from "./state.js";
import { formatVersion, getValue } from "./utils.js";

function updateDeckDisplay(deck) {
  elements.deckName.textContent = deck.name;
  elements.deckVersion.textContent = formatVersion(deck.version);
}

function renderDeckList(onSelectDeck) {
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
    if (onSelectDeck) {
      item.addEventListener("click", () => {
        onSelectDeck(index);
      });
    }
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

function renderHistory(onSelectPreview) {
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
    if (onSelectPreview) {
      row.addEventListener("click", () => {
        onSelectPreview(entry.card);
      });
    }
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

function createAboutRow(label, value) {
  const row = document.createElement("div");
  row.className = "about-row";

  const labelEl = document.createElement("div");
  labelEl.className = "about-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("div");
  valueEl.className = "about-value";
  if (value instanceof Node) {
    valueEl.appendChild(value);
  } else {
    valueEl.textContent = value;
  }

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

function openAboutModal() {
  const list = document.createElement("div");
  list.className = "about-list";

  const appVersion = `${APP_NAME} ${formatVersion(APP_VERSION)}`;
  list.appendChild(createAboutRow("App", appVersion));
  list.appendChild(createAboutRow("Creator", APP_AUTHOR));

  const issuesLink = document.createElement("a");
  issuesLink.href = APP_ISSUES_URL;
  issuesLink.target = "_blank";
  issuesLink.rel = "noreferrer";
  issuesLink.textContent = "Go here";
  list.appendChild(createAboutRow("Suggestions & bugs", issuesLink));

  list.appendChild(createAboutRow("Shortcuts", APP_SHORTCUTS));

  openModal({
    title: "About",
    bodyNodes: list,
    confirmLabel: "Close",
    variant: "about",
  });
}

function openModal(messageOrOptions, overrides = {}) {
  const input = messageOrOptions ?? {};
  const options =
    typeof input === "string" ? { body: input, ...overrides } : { ...input };
  const {
    title = "Notice",
    body = "",
    bodyNodes = null,
    confirmLabel = "OK",
    cancelLabel = "",
    variant = "",
    onConfirm = null,
    onCancel = null,
    closeOnOverlay = true,
  } = options || {};

  elements.modalTitle.textContent = title;
  elements.modalOk.textContent = confirmLabel;
  elements.modalCancel.textContent = cancelLabel || "Cancel";
  const showCancel = Boolean(cancelLabel);
  elements.modalCancel.hidden = !showCancel;
  elements.modalBody.innerHTML = "";

  if (bodyNodes) {
    const nodes = Array.isArray(bodyNodes) ? bodyNodes : [bodyNodes];
    for (const node of nodes) {
      elements.modalBody.appendChild(node);
    }
  } else {
    elements.modalBody.textContent = body;
  }

  elements.modal.classList.toggle("is-about", variant === "about");
  elements.modalOverlay.hidden = false;
  state.modalOpen = true;
  state.modalOnConfirm = onConfirm;
  state.modalOnCancel = onCancel;
  state.modalCloseOnOverlay = closeOnOverlay;
  const focusTarget = showCancel ? elements.modalCancel : elements.modalOk;
  focusTarget.focus();
}

function closeModal() {
  elements.modalOverlay.hidden = true;
  elements.modal.classList.remove("is-about");
  state.modalOpen = false;
  state.modalOnConfirm = null;
  state.modalOnCancel = null;
  state.modalCloseOnOverlay = true;
}

function setDrawEnabled(enabled) {
  elements.drawButton.disabled = !enabled;
}

export {
  applyLayoutVars,
  closeModal,
  getLayoutMetrics,
  highlightDeck,
  openAboutModal,
  openModal,
  renderCard,
  renderCardView,
  renderDeckError,
  renderDeckList,
  renderHistory,
  renderPreviewCard,
  setDrawEnabled,
  updateDeckDisplay,
  updateRemaining,
};
