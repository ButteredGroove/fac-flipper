# FAC Flipper repository instructions

## Architecture and FAC behavior

- Keep this a static browser app using vanilla JavaScript ES modules. `app.js` coordinates interactions; `src/deck.js` loads, validates, and shuffles decks; `src/state.js` holds session state and DOM references; `src/ui.js` renders cards and dialogs; `src/preferences.js` handles browser preferences.
- Preserve the data-driven Statis Pro Baseball FAC model: `decks/index.json` discovers deck definitions, `deck.json` links CSV card data and JSON layouts, and the renderer displays declared fields without interpreting baseball rules. New deck formats should use data and layouts rather than edition-specific application logic.
- Preserve CSV values, including blanks and leading zeros. Keep unique trimmed headers, consistent row widths, nonempty decks, and layout field validation; use the shipped-deck integrity tests when changing deck data or loading.
- Preserve both draw modes: with replacement by default on reload; without replacement draws from a shuffled shoe and automatically reshuffles on exhaustion. Reshuffle retains current card/history; Reset clears them. Preserve existing confirmation behavior, history previews, and remembering only successfully loaded decks.

## Local development and verification

- Use Node.js 24 (`.nvmrc`) and the locked npm dependencies. There is no build script or bundling step; serve the static files over HTTP.
- Run commands from the repository root:
  - `node scripts/test-server.cjs`: serve at `http://127.0.0.1:4174/`; opening `index.html` directly cannot load modules and decks correctly.
  - `npm run lint`: Biome checks.
  - `npm test`: Vitest with jsdom; tests live in `tests/`.
  - `npm run test:browser`: Playwright Chromium smoke tests in `browser-tests/`. Requires installed Chromium; starts its own server on port 4174, so stop any manual server first.
- For application changes, run lint and Vitest; run browser tests for UI, interaction, or deck-loading changes. These are also the CI and Pages validation commands. For documentation-only changes, verify every instruction against the referenced repository files and check the diff. Report unavailable prerequisites and failed checks accurately.
- Complete well-defined tasks autonomously through appropriate verification and prepare the working app for user acceptance. Finish with a concise change/test summary and concrete manual acceptance steps using the local server and affected interactions.

## Change and release boundaries

- Preserve unrelated working-tree and staged changes; stage only task files. Make focused local commits only when the task explicitly authorizes them. A local commit never authorizes a push.
- Require explicit user approval before remote pushes, deployments, publication, or destructive changes. The Pages workflow deploys on pushes to `main`/`master` and manual dispatch; do not trigger it without deployment approval.
