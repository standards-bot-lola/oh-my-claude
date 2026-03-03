# oh-my-claude

Visualize your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) token usage, estimate what you'd pay through the API, and see how your AI footprint stacks up against a plant-based diet.

**Zero dependencies. Runs in your browser. All data stays local.**

> **Not affiliated with Anthropic.** This is an independent, open-source project. It reads the local stats file that Claude Code already creates on your machine and does math on it — that's it. "Claude" is a trademark of Anthropic, PBC. Cost estimates are based on publicly listed API pricing and may not reflect what you actually pay under a subscription plan. Environmental figures are rough, directional estimates — not precise measurements. See [Methodology](#the-burger-index) for sources and caveats.

<!-- TODO: Add a screenshot here once deployed -->

## Quick Start

Open `index.html` directly in your browser, or serve it:

```bash
npx serve .
```

Then load your `~/.claude/stats-cache.json` (drag & drop or file picker). That's it.

## Features

- **Token totals** — Input, output, cache read, cache write by model
- **API cost estimates** — What you'd pay at Anthropic API rates (Opus, Sonnet, Haiku)
- **Daily charts** — Token output by model, messages + tool calls, session start hours
- **Multi-machine support** — Load stats from multiple computers, see merged + per-machine views
- **Persistent storage** — Machines cached in localStorage so you can revisit and update over time
- **The Burger Index** — Your AI CO₂ translated into cheeseburgers, compared against what a plant-based diet saves

## Multi-Machine Workflow

Claude Code creates `~/.claude/stats-cache.json` on each machine. If you use Claude on multiple computers:

1. Open the dashboard
2. Click **+ Add Machine** and load each machine's stats file
3. Give each a name (Desktop, Laptop, Work PC)
4. Data is merged automatically — totals, charts, and breakdowns reflect all machines
5. Stats persist in your browser's localStorage — come back anytime
6. Click the refresh icon on a machine pill to update it with a newer stats file

To sync files between machines, you can copy `stats-cache.json` via USB, cloud drive, or `scp`.

## Where's the Stats File?

| OS | Path |
|----|------|
| macOS / Linux | `~/.claude/stats-cache.json` |
| Windows | `C:\Users\<you>\.claude\stats-cache.json` |

The file is created automatically by Claude Code and updated as you use it. It contains aggregate usage data — no conversation content.

## Pricing

Costs are estimated using [Anthropic's published API pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) as of March 2026:

| Model | Input | Output | Cache Read | Cache Write |
|-------|-------|--------|------------|-------------|
| Opus 4.5 / 4.6 | $5/MTok | $25/MTok | $0.50/MTok | $6.25/MTok |
| Sonnet 4.5 / 4.6 | $3/MTok | $15/MTok | $0.30/MTok | $3.75/MTok |
| Haiku 4.5 | $0.80/MTok | $4/MTok | $0.08/MTok | $1/MTok |

Claude Code subscriptions (Max, Pro) include usage in the subscription cost — these estimates show what the equivalent API usage would cost, not what you actually paid.

## The Burger Index

The dashboard estimates the CO₂ footprint of your AI usage and compares it against the environmental savings of a plant-based diet:

**AI side:**
- Energy per token: ~1 kWh/MTok output, ~0.3 kWh/MTok input, ~0.02 kWh/MTok cache reads
- CO₂ per kWh: 0.42 kg (US grid average, EPA eGRID 2024)

**Diet side:**
- 1 beef cheeseburger = ~4.5 kg CO₂e (full lifecycle: feed, methane, transport, cooking)
- Average American consumption: ~2.4 beef burgers/week (USDA)

**The ratio** shows how many times over your plant-based diet offsets your AI inference footprint. If the ratio is >1x, your diet more than covers it.

These are rough order-of-magnitude estimates. Token-to-energy figures vary 10x+ depending on hardware, batch size, and data center efficiency. The point is directional, not precise.

Sources: [TokenPowerBench (arxiv 2024)](https://arxiv.org/html/2512.03024v1), [Muxup (2026)](https://muxup.com/2026q1/per-query-energy-consumption-of-llms), [co2everything.com](https://www.co2everything.com/co2e-of/beef), [SixDegreesNews](https://www.sixdegreesnews.org/archives/10261/the-carbon-footprint-of-a-cheeseburger/)

## Privacy

- **No server.** Everything runs client-side in your browser.
- **No tracking.** No analytics, no telemetry, no network requests (except Google Fonts and Chart.js CDN).
- **No uploads.** Your stats data never leaves your machine. localStorage is browser-local only.
- **No cookies.** Data is stored in localStorage, not cookies.

To go fully offline, download the Google Fonts and Chart.js files locally and update the references in `index.html`.

## Tech

Single-page app with zero build step:

- **Chart.js 4** via CDN for charts
- **IBM Plex** (Sans + Mono) via Google Fonts
- **Vanilla JS** with a `TD` namespace (no framework, no bundler)
- **localStorage** for machine data persistence

6 JS modules loaded via `<script>` tags (works from `file://` — no server required):

```
js/config.js   — Pricing tables, environmental constants
js/utils.js    — Formatting, animation helpers
js/storage.js  — Multi-machine localStorage CRUD
js/engine.js   — Data merging, cost calculation, burger math
js/charts.js   — Chart.js rendering
js/app.js      — DOM orchestration, file loading, machine management
```

## Contributing

PRs welcome. Some ideas:

- [ ] Multi-file merge export (download combined JSON)
- [ ] Date range filter on charts
- [ ] Per-project breakdown (if Claude Code adds this to stats)
- [ ] Dark/light theme toggle
- [ ] Self-hosted font + chart.js for full offline mode

## License

MIT
