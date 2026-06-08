function validateDeckManifest(deckJson, deckUrl) {
  const requiredFields = ["data_csv", "layout_json"];
  const invalidFields = requiredFields.filter((field) => {
    const value = deckJson?.[field];
    return typeof value !== "string" || value.trim() === "";
  });
  if (invalidFields.length > 0) {
    const label = invalidFields.length === 1 ? "field" : "fields";
    throw new Error(
      `Deck manifest at ${deckUrl} is missing or invalid required ${label}: ${invalidFields.join(
        ", ",
      )}.`,
    );
  }
}

async function loadDeckDefinition(path) {
  const deckUrl = new URL(path, window.location.href).toString();
  const deckJson = await fetchJson(deckUrl);
  validateDeckManifest(deckJson, deckUrl);
  return {
    path,
    deckUrl,
    name: deckJson.name || "Untitled Deck",
    version: deckJson.version || "",
    dataCsv: new URL(deckJson.data_csv, deckUrl).toString(),
    layoutJson: new URL(deckJson.layout_json, deckUrl).toString(),
    cards: null,
    layout: null,
    parseWarnings: [],
  };
}

async function ensureDeckLoaded(deck) {
  if (deck.loadError) {
    throw new Error(deck.loadError);
  }
  if (!Array.isArray(deck.parseWarnings)) {
    deck.parseWarnings = [];
  }
  if (deck.cards && deck.layout) {
    return;
  }

  const [csvText, layout] = await Promise.all([
    fetchText(deck.dataCsv),
    fetchJson(deck.layoutJson),
  ]);

  const { cards, warnings } = parseCards(csvText);
  validateLayoutFields(cards, layout, deck.dataCsv);
  deck.cards = cards;
  deck.parseWarnings = warnings;
  deck.layout = layout;
}

function validateLayoutFields(cards, layout, csvPath) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return;
  }

  const firstCard = cards[0] || {};
  const availableFields = new Set(
    Object.keys(firstCard).filter((field) => field !== "__id"),
  );
  const missingFields = getMissingLayoutFields(layout, availableFields);
  if (missingFields.length === 0) {
    return;
  }

  const requiredFields = getRequiredLayoutFields(layout);
  const missingAllRequiredFields =
    requiredFields.length > 0 &&
    requiredFields.every((field) => !availableFields.has(field));
  const headerHint = missingAllRequiredFields
    ? " The CSV may be missing its header row."
    : "";

  throw new Error(
    `Deck CSV at ${csvPath} is missing fields required by the layout: ${missingFields.join(
      ", ",
    )}.${headerHint}`,
  );
}

function getMissingLayoutFields(layout, availableFields) {
  const missing = [];
  const seen = new Set();
  const blocks = Array.isArray(layout?.blocks) ? layout.blocks : [];

  for (const block of blocks) {
    if (block?.type === "kv") {
      for (const item of block.items || []) {
        const field = typeof item?.field === "string" ? item.field : "";
        if (!field || availableFields.has(field) || seen.has(field)) {
          continue;
        }
        seen.add(field);
        missing.push(field);
      }
      continue;
    }

    if (block?.type !== "table") {
      continue;
    }

    const rows = Array.isArray(block.rows) ? block.rows : [];
    for (const column of block.columns || []) {
      const prefix =
        typeof column?.field_prefix === "string" ? column.field_prefix : "";
      if (!prefix) {
        continue;
      }

      const allField = `${prefix}all`;
      const hasAllField = availableFields.has(allField);
      for (const rowKey of rows) {
        const field = `${prefix}${rowKey}`;
        if (hasAllField || availableFields.has(field) || seen.has(field)) {
          continue;
        }
        seen.add(field);
        missing.push(field);
      }
    }
  }

  return missing;
}

function getRequiredLayoutFields(layout) {
  const required = [];
  const seen = new Set();
  const blocks = Array.isArray(layout?.blocks) ? layout.blocks : [];

  for (const block of blocks) {
    if (block?.type === "kv") {
      for (const item of block.items || []) {
        const field = typeof item?.field === "string" ? item.field : "";
        if (!field || seen.has(field)) {
          continue;
        }
        seen.add(field);
        required.push(field);
      }
      continue;
    }

    if (block?.type !== "table") {
      continue;
    }

    const rows = Array.isArray(block.rows) ? block.rows : [];
    for (const column of block.columns || []) {
      const prefix =
        typeof column?.field_prefix === "string" ? column.field_prefix : "";
      if (!prefix) {
        continue;
      }

      for (const rowKey of rows) {
        const field = `${prefix}${rowKey}`;
        if (seen.has(field)) {
          continue;
        }
        seen.add(field);
        required.push(field);
      }
    }
  }

  return required;
}

function parseCards(csvText) {
  const parser = window.Papa;
  if (!parser) {
    throw new Error("PapaParse is not available.");
  }
  const result = parser.parse(csvText, { skipEmptyLines: "greedy" });
  const warnings = Array.isArray(result.errors) ? result.errors : [];
  if (warnings.length) {
    console.warn("CSV parse errors:", warnings);
  }
  const rows = Array.isArray(result.data) ? result.data : [];
  if (rows.length === 0) {
    return { cards: [], warnings };
  }
  const headers = rows[0].map((header) => String(header ?? "").trim());
  const cards = rows
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
  return { cards, warnings };
}

function shuffle(list) {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function fetchJson(path) {
  const response = await fetchResponse(path);
  return response.json();
}

async function fetchText(path) {
  const response = await fetchResponse(path);
  return response.text();
}

function formatHttpError(path, response) {
  const statusText = response.statusText ? ` ${response.statusText}` : "";
  return `Failed to load ${path} (HTTP ${response.status}${statusText})`;
}

function formatNetworkError(path, error) {
  let reason = "Unknown error";
  if (error instanceof Error && error.message) {
    reason = error.message;
  } else if (typeof error === "string" && error) {
    reason = error;
  } else if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    reason = error.message;
  }
  return `Network error while loading ${path}: ${reason}`;
}

async function fetchResponse(path) {
  let response;
  try {
    response = await fetch(path);
  } catch (error) {
    throw new Error(formatNetworkError(path, error));
  }
  if (!response.ok) {
    throw new Error(formatHttpError(path, response));
  }
  return response;
}

export {
  ensureDeckLoaded,
  fetchJson,
  fetchText,
  loadDeckDefinition,
  parseCards,
  shuffle,
};
