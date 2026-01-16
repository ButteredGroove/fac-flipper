# fac-flipper

*A minimalist web UI for drawing and displaying Fast Action Cards (FACs) from configurable decks.*

---

## Overview

**fac-flipper** is a lightweight, data-driven web interface for drawing and viewing cards used in baseball simulation boardgames.

This project focuses on **presentation and interaction**, not game logic. Its sole responsibility is to draw a card from a deck and render it cleanly and accurately according to a declarative layout.

## Live site

<https://butteredgroove.github.io/fac-flipper/>

---

## Why this exists

Cards are often fundamental to baseball sims, but digital implementations are often:

- tightly coupled to specific rule sets
- visually rigid
- difficult to inspect or reuse programmatically

**fac-flipper** is designed to be:

- **Minimal** - optimized for quick draws and readability
- **Flexible** - supports multiple FAC formats and layouts
- **Data-first** - card meaning lives in structured data
- **Reusable** - suitable as a UI tool or a building block for larger engines

> FACs differ in presentation, not meaning.

---

## Features

- Draw cards from FAC decks
- With- or without-replacement draw modes
- Automatic shuffle and reshuffle
- Optional reshuffle with or without clearing history
- Clean, minimalist card rendering
- Support for multiple FAC layouts and variants
- Recent draw history
- Click history entries to preview previous cards
- Keyboard shortcuts for fast interaction

---

## Controls

- Click the card or press Space/Enter to draw.
- Press `R` or click Reshuffle to reshuffle without clearing history (confirmation required).
- Use the Reset button to reshuffle and clear history (confirmation required).
- Click a different deck to switch (confirmation required).
- Clicking the active deck does nothing.
- Click a history entry to preview it alongside the current card.
- Click About for version, author, and support link.

---

## Included decks

This repository includes ready-to-use decks for:

- **Statis Pro 4th Edition** (v2022)
- **Statis Pro 2nd & 3rd Editions** (v1987)

Each deck is implemented using the same underlying data and layout system, demonstrating how different FAC formats can coexist without changes to application code.

---

## Design principles

- **Separation of meaning and presentation**
  - Card data is stored in CSV
  - Visual layout is defined in JSON
- **Loose, permissive schema**
  - Sparse data is allowed
  - Decks may define different fields
- **Dumb renderer**
  - The UI does not interpret baseball rules
  - It only renders what the layout declares

---

## Project structure (high level)

``` bash
fac-flipper/
  index.html
  styles.css
  app.js
  src/
    config.js
    deck.js
    state.js
    ui.js
    utils.js
  decks/
    index.json
    SP2n3ED/
      deck.json
      cards.csv
      layout.json
    SP4ED/
      deck.json
      cards.csv
      layout.json
  README.md
```

---

## Development

Tests use Vitest with a jsdom environment.

Run the test suite:

```bash
npm test
```

Run lint checks:

```bash
npm run lint
```

---

## Creating your own deck

Creating a new FAC deck requires **no code changes**.

### 1. Create a deck folder

Under `decks/`, create a new directory:

``` bash
decks/my-deck/
```

### 2. Add the deck to the manifest (`decks/index.json`)

The UI uses a manifest file to discover decks.

```json
{
  "decks": [
    "decks/my-deck/deck.json"
  ]
}
```

### 3. Define the deck manifest (`deck.json`)

This file ties everything together.

```json
{
  "name": "My FAC Deck",
  "version": "1.0",
  "source": "Derived from Example FAC set (2022)",
  "row_modifications": {
    "source": "https://example.com/fac-corrections",
    "123": {
      "RN": "Changed to '73' from 'Yes'"
    }
  },
  "data_csv": "cards.csv",
  "layout_json": "layout.json"
}
```

`source` is optional metadata for documenting where the card data came from; the UI ignores it.
`row_modifications` is optional metadata for noting data fixes or overrides applied to the deck, keyed by card id and column id. The UI ignores it.

### 4. Add card data (`cards.csv`)

- One row per card
- Columns represent semantic fields
- Blank values are allowed
- Field names are free-form, but must match those referenced by the layout

Example (simplified):

```csv
card_id,pb,rn,pitch,error_trigger,out_primary_rp,out_primary_rn
001,7,,Yes,16-20,G4A,GX6
```

### 5. Define the layout (`layout.json`)

Layouts declare **how** fields are rendered, not what they mean.

- Supports:
  - key-value blocks (meta, errors, sequences, notes)
  - table blocks (rows + columns)
- Blocks specify position, size, and which fields to display
- Layouts may omit blocks entirely if a deck does not use them

Table cell resolution uses this naming convention:

- `{field_prefix}{rowKey}` for row-specific values
- `{field_prefix}all` for defaults (optional)

Layouts can optionally style values with simple color rules. Table columns can also style headers with `headerStyles`.
Key-value blocks can opt into left-aligned values and fixed label widths using `block.styles`.

```json
{
  "styles": {
    "color": "#dc2626",
    "colorRules": [
      { "match": "Yes", "color": "#16a34a" },
      { "prefix": "SP:", "color": "#16a34a" }
    ]
  },
  "headerStyles": {
    "color": "#dc2626"
  }
}
```

```json
{
  "styles": {
    "valueAlign": "left",
    "labelWidth": "3ch"
  }
}
```

No FAC-specific logic exists in the renderer.

---

## Hosting

**fac-flipper** is a static web app and can be hosted on **any web host or web hosting site** that serves static files.

## Analytics

This site uses GoatCounter for privacy-friendly analytics. The tracking snippet lives in `index.html` and points to `https://butteredgroove.goatcounter.com/count`. If you host your own fac-flipper, be
sure to update to point to your counter.

---

## Non-goals (intentional)

- No game or simulation logic
- No rule enforcement
- No card editing in the UI
- No "draw N cards" or hand management
- No framework lock-in

---

## Status

Current version: **v0.0.12**.

This release establishes:

- core UI
- deck loading
- layout-driven rendering
- draw/shuffle behavior

Future versions may improve polish and tooling, but the architectural principles are intended to remain stable.
