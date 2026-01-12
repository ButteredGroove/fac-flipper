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

function parseCards(csvText) {
  const parser = window.Papa;
  if (!parser) {
    throw new Error("PapaParse is not available.");
  }
  const result = parser.parse(csvText, { skipEmptyLines: "greedy" });
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

export {
  ensureDeckLoaded,
  fetchJson,
  fetchText,
  loadDeckDefinition,
  parseCards,
  shuffle,
};
