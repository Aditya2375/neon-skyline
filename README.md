# neon-skyline

Your last year on GitHub as a New York night skyline. One tower per week. Each tower has seven window columns, one per weekday, and the lit windows in a column rise with that day's contributions. Landmarks stand behind the data towers: Empire State, Chrysler, One World Trade, Woolworth, plus a few others. A single SVG with no dependencies and no external requests.

## Use it

```
GITHUB_TOKEN=<token> node skyline.mjs <your-login> skyline.svg
```

Any token that can read public data works, including the one Actions provides. Embed with `![skyline](skyline.svg)`. Hover a tower for its week and total. Animation (twinkling windows, the beacon, ripples) turns off for readers who prefer reduced motion. Needs Node 18+.

Honest reading: tower height is the square root of the week's total, so a quiet week is a stub, not an empty slot. Landmarks are decoration and carry no data.

See the live page: https://aditya2375.github.io/neon-skyline/

MIT licence.
