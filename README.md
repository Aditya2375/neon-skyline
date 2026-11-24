# neon-skyline

Your last year on GitHub as a night city. One tower per week, taller for busier weeks, your name in neon. A single animated SVG, no external services, no dependencies.

![skyline](skyline.svg)

## Use it

```
GITHUB_TOKEN=<token> node skyline.mjs <your-login> skyline.svg
```

Any token that can read public data works, including the one Actions provides. Embed the result in a profile README with `![skyline](skyline.svg)`. The included workflow rebuilds it daily.

Hover a tower for its week total. Animation is turned off for readers who prefer reduced motion. Needs Node 18+.

MIT licence.
