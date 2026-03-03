# Skill: Extend the Dashboard

Use this skill when adding new sections, charts, or data views to the dashboard.

## Architecture Quick Reference

The dashboard renders in a single pass inside `renderDashboard()` in `js/app.js`. The flow:

```
renderDashboard()
  ├── TD.mergeStats(machines)     → merged data across all machines
  ├── TD.computeCosts(modelUsage) → { models, totals }
  ├── TD.computeDaySpan(merged)   → days of AI data
  ├── TD.computeDietDaySpan(merged) → days since first session (for diet)
  ├── renderMachineBar()
  ├── renderSummaryCards()
  ├── TD.renderDailyChart()       → js/charts.js
  ├── TD.renderModelChart()       → js/charts.js
  ├── TD.renderActivityChart()    → js/charts.js
  ├── TD.renderHourChart()        → js/charts.js
  ├── renderCostTable()
  ├── renderTokenTable()
  ├── renderMachineBreakdown()
  ├── renderBurger()              → diet profiles + burger index
  └── animateAllCounters()
```

## Adding a New Chart

1. **Add a canvas** in `index.html` inside `#dashboard`:
   ```html
   <div class="chart-grid fade-in" style="animation-delay:0.2s">
     <div class="chart-card">
       <h3>Your Chart Title</h3>
       <canvas id="myNewChart"></canvas>
     </div>
   </div>
   ```

2. **Create the render function** in `js/charts.js`:
   ```js
   var myChartInstance = null;

   TD.renderMyNewChart = function(canvasId, data) {
     var ctx = document.getElementById(canvasId).getContext('2d');
     myChartInstance = new Chart(ctx, { /* config */ });
   };
   ```

3. **Destroy on re-render** — add to `TD.destroyCharts()` in `js/charts.js`:
   ```js
   if (myChartInstance) { myChartInstance.destroy(); myChartInstance = null; }
   ```

4. **Call it** from `renderDashboard()` in `js/app.js`:
   ```js
   TD.renderMyNewChart('myNewChart', merged.someData);
   ```

## Adding a New Summary Card

Summary cards are rendered as raw HTML in `renderSummaryCards()`. Add a new `<div class="card">` block. Use `TD.fmt()` for large numbers and `TD.fmtUSD()` for currency. For animated counters, give the value element an `id` and call `TD.animateCounter()` in `animateAllCounters()`.

## Adding a New Table Section

Follow the pattern of `renderCostTable()` or `renderTokenTable()`:
1. Add a `<div class="section">` with a `<div class="table-wrap" id="myTable">` in HTML
2. Build the table HTML string in a render function in `app.js`
3. Set `document.getElementById('myTable').innerHTML = html`

## Data Available from stats-cache.json

```
merged.modelUsage      → { "model-id": { inputTokens, outputTokens, cacheReadInputTokens, cacheCreationInputTokens } }
merged.dailyActivity   → [{ date, messageCount, sessionCount, toolCallCount }]
merged.dailyModelTokens → [{ date, tokensByModel: { "model-id": { input, output } } }]
merged.hourCounts      → [count0, count1, ..., count23]  (UTC hours)
merged.totalSessions   → number
merged.totalMessages   → number
merged.firstSessionDate → "YYYY-MM-DD"
merged.lastComputedDate → "YYYY-MM-DD"
```

## Style Notes

- Use `fade-in` class with staggered `animation-delay` for entrance animations
- Chart grids: `.chart-grid` gives you a 2-column layout (1-column on mobile)
- Tables: `.table-wrap` > `table` with `.label-cell` for left column, `.right` for numeric columns
- Follow the existing `section-title` pattern for section headers
