# Changelog

All notable changes to this project will be documented in this file.

## Added

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

- Modify size of card ([#2](https://github.com/ButteredGroove/fac-flipper/issues/2))
- Replace Custom CSV Parser with PapaParse ([#4](https://github.com/ButteredGroove/fac-flipper/issues/4))
- Decompose app.js into ES Modules ([#5](https://github.com/ButteredGroove/fac-flipper/issues/5))

## Fixed

- Harden formatVersion for numeric deck versions ([#44](https://github.com/ButteredGroove/fac-flipper/issues/44))
- Surface CSV parse warnings in the UI ([#26](https://github.com/ButteredGroove/fac-flipper/issues/26))
- Improve fetch errors with HTTP status details and clearer network failures ([#25](https://github.com/ButteredGroove/fac-flipper/issues/25))
- Validate deck manifests for required fields ([#24](https://github.com/ButteredGroove/fac-flipper/issues/24))
- Surface deck load failures in `selectDeck` ([#23](https://github.com/ButteredGroove/fac-flipper/issues/23))
- Guard deck selection against concurrent loads ([#22](https://github.com/ButteredGroove/fac-flipper/issues/22))
- Social image fails to display ([#32](https://github.com/ButteredGroove/fac-flipper/issues/32))
- Field value errors in SPADV deck ([#49](https://github.com/ButteredGroove/fac-flipper/issues/49)) and ([#50](https://github.com/ButteredGroove/fac-flipper/issues/50))

## Maintenance

- Configure and Run Biome for Code Formatting and Linting ([#1](https://github.com/ButteredGroove/fac-flipper/issues/1))
- Normalize LF for line ending ([#19](https://github.com/ButteredGroove/fac-flipper/issues/19))
- Expand test coverage for draw/history/rendering/utils ([#29](https://github.com/ButteredGroove/fac-flipper/issues/29))
