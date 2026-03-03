# oh-my-claude

Visualize your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) token usage, estimate what you'd pay through the API, and see how your AI footprint stacks up against your dietary choices.

**Zero dependencies. Runs in your browser. All data stays local.**

> **Not affiliated with Anthropic.** This is an independent, open-source project built by [dizruptr](https://dizruptr.to). It reads the local stats file that Claude Code already creates on your machine and does math on it — that's it. "Claude" is a trademark of Anthropic, PBC. Cost estimates are based on publicly listed API pricing and may not reflect what you actually pay under a subscription plan. Environmental figures use 3-tier ranges (conservative/moderate/generous) from peer-reviewed sources — see [Methodology](#methodology) for details.

## Quick Start

1. In Claude Code, run `/stats` to refresh your usage data
2. Copy the stats file somewhere your browser can access:
   ```bash
   # macOS / Linux
   cp ~/.claude/stats-cache.json ~/Documents/

   # Windows
   copy %USERPROFILE%\.claude\stats-cache.json %USERPROFILE%\Documents\
   ```
3. Open [oh-my-claude.com](https://oh-my-claude.com) (or `index.html` locally)
4. Drop the file or click to browse

The `~/.claude` folder is hidden — it won't appear in your browser's file picker, which is why you need to copy it first.

## Features

- **Token totals** — Input, output, cache read, cache write by model
- **API cost estimates** — What you'd pay at Anthropic API rates (Opus, Sonnet, Haiku)
- **Daily charts** — Token output by model, messages + tool calls, session start hours
- **Multi-machine support** — Load stats from multiple computers, see merged + per-machine views
- **Persistent storage** — Machines cached in localStorage so you can revisit and update over time
- **Dietary profiles** — Omnivore, Pescatarian, Vegetarian, Vegan — full daily CO2 savings vs omnivore baseline
- **The Burger Index** — AI CO2 translated into cheeseburgers as a fun, visceral comparison
- **3-tier estimates** — Conservative, Moderate, and Generous ranges for every figure

## Multi-Machine Workflow

Claude Code creates `~/.claude/stats-cache.json` on each machine. If you use Claude on multiple computers:

1. Open the dashboard
2. Click **+ Add Machine** and load each machine's stats file
3. Give each a name (Desktop, Laptop, Work PC)
4. Data is merged automatically — totals, charts, and breakdowns reflect all machines
5. Stats persist in your browser's localStorage — come back anytime
6. Click the refresh icon on a machine pill to update it with a newer stats file

You can also drag-drop files directly onto the page at any time — even when the dashboard is already showing.

## Pricing

Costs are estimated using [Anthropic's published API pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) as of March 2026:

| Model | Input | Output | Cache Read | Cache Write |
|-------|-------|--------|------------|-------------|
| Opus 4.5 / 4.6 | $5/MTok | $25/MTok | $0.50/MTok | $6.25/MTok |
| Sonnet 4.5 / 4.6 | $3/MTok | $15/MTok | $0.30/MTok | $3.75/MTok |
| Haiku 4.5 | $0.80/MTok | $4/MTok | $0.08/MTok | $1/MTok |

Claude Code subscriptions (Max, Pro) include usage in the subscription cost — these estimates show what the equivalent API usage would cost, not what you actually paid.

## Dietary Profiles

The dashboard compares your AI CO2 footprint against the environmental savings of different diets. Daily CO2e by diet type:

| Diet | Conservative | Moderate | Generous |
|------|-------------|----------|----------|
| Omnivore (baseline) | 3.0 kg/day | 3.6 kg/day | 7.2 kg/day |
| Pescatarian | 2.2 kg/day | 2.7 kg/day | 3.9 kg/day |
| Vegetarian | 2.0 kg/day | 2.45 kg/day | 3.5 kg/day |
| Vegan | 1.0 kg/day | 1.38 kg/day | 2.5 kg/day |

**Savings = (omnivore baseline - your diet) x days.** A vegan saving ~2.2 kg/day over 90 days offsets ~200 kg CO2 — far more than the burger-only metric suggests.

The burger equivalent is kept as a fun secondary comparison: "Your AI runs on 0.1-0.6 burgers of CO2."

## Methodology

All figures are computed under 3 tiers:

- **Conservative** — Low-end estimates, favorable assumptions
- **Moderate** — Best available peer-reviewed midpoints
- **Generous** — Upper-bound estimates, worst-case assumptions

**Dietary CO2:** Scarborough et al. 2023 (EPIC-Oxford cohort, Nature Food) and Poore & Nemecek 2018 (Science meta-analysis, 38,700 farms).

**Energy per token:** ~1 kWh/MTok output (moderate). Range: 0.4-2.0 depending on hardware and batch size. Sources: TokenPowerBench (arxiv 2024), Muxup (2026), John Snow Labs.

**CO2 per kWh:** 0.42 kg moderate (US grid avg, EPA eGRID 2024). Range: 0.28-0.55.

**Burger footprint:** 4.5 kg CO2e moderate (Poore & Nemecek 2018). Range: 2.5-6.5 kg.

**Caveats:** Token-to-energy estimates vary 10x+ by hardware, batch size, and PUE. Dietary footprints assume typical Western grocery patterns. Anthropic's actual data center efficiency is not public. The range captures most of this uncertainty.

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
- **localStorage** for machine data and diet profile persistence

6 JS modules loaded via `<script>` tags (works from `file://` — no server required):

```
js/config.js   — Pricing tables, environmental constants, dietary profiles
js/utils.js    — Formatting, animation helpers
js/storage.js  — Multi-machine localStorage CRUD
js/engine.js   — Data merging, cost calculation, diet + burger math
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
