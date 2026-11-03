# Changelog

All notable changes to this project will be documented in this file.

## Added

- Add a preference for translucent or opaque card flashes ([#86](https://github.com/ButteredGroove/fac-flipper/issues/86))
- Updated SPADV deck to 2026 v1 ([#59](https://github.com/ButteredGroove/fac-flipper/issues/59))
- Add 4th edition FAC deck without MUST STEAL cards ([#58](https://github.com/ButteredGroove/fac-flipper/issues/58))
- Add 2nd/3rd edition FAC deck ([#3](https://github.com/ButteredGroove/fac-flipper/issues/3))
- Add Vitest and Initial Unit Tests for Data Parsing ([#6](https://github.com/ButteredGroove/fac-flipper/issues/6))
- Add analytics tracking ([#10](https://github.com/ButteredGroove/fac-flipper/issues/10))
- Add About button ([#14](https://github.com/ButteredGroove/fac-flipper/issues/14))
- Add confirmation dialogs ([#15](https://github.com/ButteredGroove/fac-flipper/issues/15))
- Add basic SEO metadata to `index.html` ([#30](https://github.com/ButteredGroove/fac-flipper/issues/30))
- Make deck selection keyboard accessible ([#27](https://github.com/ButteredGroove/fac-flipper/issues/27))
- Add favicon and app icons with manifest wiring ([#39](https://github.com/ButteredGroove/fac-flipper/issues/39))
- Remember last successfully loaded deck and restore it on startup with safe fallback behavior ([#52](https://github.com/ButteredGroove/fac-flipper/issues/52))
- Add visual flip feedback on `CURRENT CARD` draws with reduced-motion-safe fallback styling ([#51](https://github.com/ButteredGroove/fac-flipper/issues/51))

## Changed

- Make the draw animation more visible within a tightly cropped card ([#84](https://github.com/ButteredGroove/fac-flipper/issues/84))
- Modify size of card ([#2](https://github.com/ButteredGroove/fac-flipper/issues/2))
- Replace Custom CSV Parser with PapaParse ([#4](https://github.com/ButteredGroove/fac-flipper/issues/4))
- Decompose app.js into ES Modules ([#5](https://github.com/ButteredGroove/fac-flipper/issues/5))

## Fixed

- Hide the unused Cancel button in single-action dialogs ([#86](https://github.com/ButteredGroove/fac-flipper/issues/86))
- Keep the replacement switch consistent with drawing mode after a reload ([#82](https://github.com/ButteredGroove/fac-flipper/issues/82))
- Reject empty or malformed deck CSV files with clear errors ([#70](https://github.com/ButteredGroove/fac-flipper/issues/70))
- Try other decks when a startup deck fails to load ([#69](https://github.com/ButteredGroove/fac-flipper/issues/69))
- Keep keyboard focus in dialogs and restore it after closing ([#68](https://github.com/ButteredGroove/fac-flipper/issues/68))
- Harden formatVersion for numeric deck versions ([#44](https://github.com/ButteredGroove/fac-flipper/issues/44))
- Surface CSV parse warnings in the UI ([#26](https://github.com/ButteredGroove/fac-flipper/issues/26))
- Improve fetch errors with HTTP status details and clearer network failures ([#25](https://github.com/ButteredGroove/fac-flipper/issues/25))
- Validate deck manifests for required fields ([#24](https://github.com/ButteredGroove/fac-flipper/issues/24))
- Surface deck load failures in `selectDeck` ([#23](https://github.com/ButteredGroove/fac-flipper/issues/23))
- Guard deck selection against concurrent loads ([#22](https://github.com/ButteredGroove/fac-flipper/issues/22))
- Social image fails to display ([#32](https://github.com/ButteredGroove/fac-flipper/issues/32))
- Field value errors in SPADV deck ([#49](https://github.com/ButteredGroove/fac-flipper/issues/49)) and ([#50](https://github.com/ButteredGroove/fac-flipper/issues/50))

## Maintenance

- Document local setup, serving, and validation ([#73](https://github.com/ButteredGroove/fac-flipper/issues/73))
- Add browser smoke tests and shipped-deck integrity checks ([#72](https://github.com/ButteredGroove/fac-flipper/issues/72))
- Require successful lint and tests before deploying to GitHub Pages ([#71](https://github.com/ButteredGroove/fac-flipper/issues/71))
- Update vulnerable development dependencies ([#67](https://github.com/ButteredGroove/fac-flipper/issues/67))
- Update GitHub Actions and CI to Node.js 24 ([#66](https://github.com/ButteredGroove/fac-flipper/issues/66))
- Simplify application state and UI code without changing behavior ([#64](https://github.com/ButteredGroove/fac-flipper/issues/64))
- Configure and Run Biome for Code Formatting and Linting ([#1](https://github.com/ButteredGroove/fac-flipper/issues/1))
- Normalize LF for line ending ([#19](https://github.com/ButteredGroove/fac-flipper/issues/19))
- Expand test coverage for draw/history/rendering/utils ([#29](https://github.com/ButteredGroove/fac-flipper/issues/29))
