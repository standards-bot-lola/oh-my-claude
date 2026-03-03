/**
 * Chart.js rendering functions.
 * Each returns the Chart instance for cleanup.
 */
const TD = window.TD || {};

TD.charts = [];

TD.destroyCharts = function() {
  TD.charts.forEach(c => c.destroy());
  TD.charts = [];
};

// Shared tooltip style
const TIP = {
  backgroundColor: '#1f2125',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  titleFont: { size: 11, family: "'IBM Plex Mono', monospace" },
  bodyFont: { size: 11, family: "'IBM Plex Mono', monospace" },
  padding: 10,
  cornerRadius: 6,
};

const LEGEND = {
  position: 'bottom',
  labels: { boxWidth: 8, boxHeight: 8, padding: 16, font: { size: 10 }, usePointStyle: true, pointStyle: 'rectRounded' },
};

const GRID_Y = { color: 'rgba(255,255,255,0.03)' };
const NO_GRID = { display: false };

/**
 * Daily tokens stacked bar (by model).
 */
TD.renderDailyChart = function(canvasId, dailyModelTokens) {
  const labels = dailyModelTokens.map(d => TD.fmtDate(d.date));
  const allModels = [...new Set(dailyModelTokens.flatMap(d => Object.keys(d.tokensByModel)))];

  const chart = new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels,
      datasets: allModels.map(id => ({
        label: TD.getModelLabel(id),
        data: dailyModelTokens.map(d => d.tokensByModel[id] || 0),
        backgroundColor: TD.getModelColor(id),
        borderRadius: 2,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: { legend: LEGEND, tooltip: { ...TIP, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${TD.fmt(ctx.parsed.y)} tokens` } } },
      scales: {
        x: { stacked: true, grid: NO_GRID, ticks: { font: { size: 9 } } },
        y: { stacked: true, grid: GRID_Y, ticks: { font: { size: 9 }, callback: v => TD.fmt(v) } },
      },
    },
  });
  TD.charts.push(chart);
};

/**
 * Cost doughnut with center label.
 */
TD.renderModelChart = function(canvasId, modelCosts, totalCost) {
  const labels = Object.keys(modelCosts);
  const values = labels.map(l => modelCosts[l].subtotal);
  const colors = labels.map(l => modelCosts[l].color);

  const centerPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      const { ctx, chartArea: { width, height, top, left } } = chart;
      ctx.save();
      ctx.font = '600 18px "IBM Plex Mono"';
      ctx.fillStyle = '#e4e4e8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = left + width / 2;
      const cy = top + height / 2;
      ctx.fillText(TD.fmtUSD(totalCost), cx, cy - 6);
      ctx.font = '400 10px "IBM Plex Mono"';
      ctx.fillStyle = '#55575e';
      ctx.fillText('TOTAL', cx, cy + 14);
      ctx.restore();
    },
  };

  const chart = new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
    plugins: [centerPlugin],
    options: {
      responsive: true, maintainAspectRatio: true, cutout: '72%',
      animation: { animateRotate: true, duration: 1000 },
      plugins: {
        legend: LEGEND,
        tooltip: { ...TIP, callbacks: { label: ctx => ` ${ctx.label}: ${TD.fmtUSD(ctx.parsed)} (${((ctx.parsed / totalCost) * 100).toFixed(1)}%)` } },
      },
    },
  });
  TD.charts.push(chart);
};

/**
 * Daily activity grouped bar (messages + tool calls).
 */
TD.renderActivityChart = function(canvasId, dailyActivity) {
  const chart = new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: dailyActivity.map(d => TD.fmtDate(d.date)),
      datasets: [
        { label: 'Messages', data: dailyActivity.map(d => d.messageCount), backgroundColor: 'rgba(139,122,216,0.5)', borderRadius: 2 },
        { label: 'Tool calls', data: dailyActivity.map(d => d.toolCallCount), backgroundColor: 'rgba(77,162,247,0.4)', borderRadius: 2 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: { legend: LEGEND, tooltip: TIP },
      scales: {
        x: { grid: NO_GRID, ticks: { font: { size: 9 } } },
        y: { grid: GRID_Y, ticks: { font: { size: 9 }, callback: v => TD.fmt(v) } },
      },
    },
  });
  TD.charts.push(chart);
};

/**
 * Session hours bar chart.
 */
TD.renderHourChart = function(canvasId, hourCounts) {
  const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const data = Array.from({ length: 24 }, (_, i) => hourCounts?.[String(i)] || 0);
  const max = Math.max(...data, 1);

  const chart = new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map(v => `rgba(139,122,216,${0.1 + (v / max) * 0.65})`),
        borderRadius: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      animation: { duration: 800, delay: ctx => ctx.dataIndex * 25 },
      plugins: { legend: { display: false }, tooltip: { ...TIP, callbacks: { label: ctx => ` ${ctx.parsed.y} sessions` } } },
      scales: {
        x: { grid: NO_GRID, ticks: { font: { size: 8 }, maxRotation: 0, callback: (v, i) => i % 4 === 0 ? labels[i] : '' } },
        y: { grid: GRID_Y, ticks: { font: { size: 9 }, stepSize: 1 } },
      },
    },
  });
  TD.charts.push(chart);
};

window.TD = TD;
