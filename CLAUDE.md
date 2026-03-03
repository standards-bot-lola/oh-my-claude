# oh-my-claude — Claude Code Instructions

## Project Overview

A zero-dependency static web dashboard that visualizes Claude Code token usage from `~/.claude/stats-cache.json`. Vanilla JS, no build step, no framework.

## Architecture

6 JS modules loaded via `<script>` tags sharing a global `TD` namespace:

```
js/config.js   → TD.PRICING, TD.ENV_TIERS, TD.DIET_PROFILES
js/utils.js    → TD.fmt(), TD.fmtUSD(), TD.animateCounter()
js/storage.js  → TD.storage.get/set/remove/names/count/clear()
js/engine.js   → TD.computeCosts(), TD.mergeStats(), TD.computeBurger(), TD.computeDietProfile()
js/charts.js   → TD.renderDailyChart(), TD.renderModelChart(), etc.
js/app.js      → IIFE, not on TD namespace. Handles DOM, file loading, rendering.
```

**Load order matters.** config → utils → storage → engine → charts → app.

## Key Patterns

- **Global namespace:** `window.TD = window.TD || {}; var TD = window.TD;` declared ONCE in config.js. All other files just use `TD` directly.
- **No modules:** These are plain `<script>` tags sharing global scope. Do NOT use `import`/`export`.
- **3-tier system:** Every environmental constant exists in conservative/moderate/generous variants via `TD.ENV_TIERS`.
- **Dietary profiles:** `TD.DIET_PROFILES` holds per-diet daily CO2 keyed by tier name. Orthogonal to the tier toggle.
- **localStorage:** Machine data in `td-machines`, diet profile in `td-diet-profile`. Simple string keys.
- **Numerical inputs:** Per project convention, NEVER auto-clamp on change. Validate on blur only.

## Adding New Models

If Anthropic releases new models, update `TD.PRICING` in `js/config.js`. The key must match the model ID string from `stats-cache.json`. Provide: `input`, `output`, `cacheRead`, `cacheWrite` (per million tokens), `label`, and `color`.

## Style Conventions

- Dark theme. CSS variables in `:root`. Colors: `--accent` (purple), `--green`, `--red`, `--orange`, `--blue`.
- Fonts: IBM Plex Sans (body) and IBM Plex Mono (data, labels, code).
- 1px gap grid cards (Vercel-style). `var(--radius-lg)` for card corners.
- `var(--ease)` for all transitions.

## Testing

No test framework. Open `index.html` in a browser, load a `stats-cache.json`, and verify:
- All 4 summary cards animate
- Charts render with correct model colors
- Tier and diet profile toggles update the Burger Index section
- Machine add/update/remove works
- Data persists on page refresh
