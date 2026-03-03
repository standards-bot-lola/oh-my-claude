/**
 * Main orchestrator: file loading, machine management, DOM rendering.
 */
(function() {
  'use strict';

  // ── Globals ──
  let pendingFile = null; // file waiting for a name

  // ── Init ──
  document.addEventListener('DOMContentLoaded', function() {
    Chart.defaults.font.family = "'IBM Plex Mono', monospace";
    Chart.defaults.font.size = 10;
    Chart.defaults.color = '#55575e';

    setupFileHandlers();
    setupGlobalDrop();

    // If we have stored machines, render immediately; collapse guide
    if (TD.storage.count() > 0) {
      renderDashboard();
    } else {
      // First visit — open the guide automatically
      document.getElementById('usageGuide').open = true;
    }
  });

  // ── File handling ──
  function setupFileHandlers() {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');

    fileInput.addEventListener('change', function(e) {
      if (e.target.files[0]) handleFile(e.target.files[0]);
      e.target.value = ''; // reset so same file can be re-selected
    });

    dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // Dialog confirm/cancel
    document.getElementById('nameConfirm').addEventListener('click', confirmName);
    document.getElementById('nameCancel').addEventListener('click', cancelName);
    document.getElementById('machineName').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') confirmName();
      if (e.key === 'Escape') cancelName();
    });
  }

  // ── Global drag-drop (works even when dashboard is showing) ──
  function setupGlobalDrop() {
    var overlay = document.getElementById('dropOverlay');
    var dragCounter = 0;

    document.addEventListener('dragenter', function(e) {
      e.preventDefault();
      dragCounter++;
      // Only show overlay when dashboard is visible (loader has its own drop zone)
      if (document.getElementById('dashboard').style.display === 'block') {
        overlay.classList.add('visible');
      }
    });

    document.addEventListener('dragleave', function(e) {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        overlay.classList.remove('visible');
      }
    });

    document.addEventListener('dragover', function(e) {
      e.preventDefault();
    });

    document.addEventListener('drop', function(e) {
      e.preventDefault();
      dragCounter = 0;
      overlay.classList.remove('visible');
      // Only intercept if dashboard is showing and file came from outside the original drop zone
      if (document.getElementById('dashboard').style.display === 'block' && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.modelUsage) throw new Error('Missing modelUsage — is this a stats-cache.json?');
        pendingFile = data;
        showNameDialog(suggestName());
      } catch (err) {
        showToast('Failed to parse: ' + err.message, true);
      }
    };
    reader.readAsText(file);
  }

  function suggestName() {
    const existing = TD.storage.names();
    const defaults = ['Desktop', 'Laptop', 'Work PC', 'Server'];
    for (const name of defaults) {
      if (!existing.includes(name)) return name;
    }
    return 'Machine ' + (existing.length + 1);
  }

  // ── Name dialog ──
  function showNameDialog(suggestion) {
    const dialog = document.getElementById('nameDialog');
    const input = document.getElementById('machineName');
    input.value = suggestion || '';
    dialog.showModal();
    setTimeout(function() { input.select(); }, 50);
  }

  function confirmName() {
    const input = document.getElementById('machineName');
    const name = input.value.trim();
    if (!name) return;
    if (!pendingFile) return;

    TD.storage.set(name, pendingFile);
    pendingFile = null;
    document.getElementById('nameDialog').close();
    renderDashboard();
    showToast(name + ' added');
  }

  function cancelName() {
    pendingFile = null;
    document.getElementById('nameDialog').close();
  }

  // ── Toast ──
  function showToast(msg, isError) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(el._timer);
    el._timer = setTimeout(function() { el.className = 'toast'; }, 2500);
  }

  // ── Dashboard render ──
  function renderDashboard() {
    const machines = TD.storage.getAll();
    const count = Object.keys(machines).length;

    if (count === 0) {
      document.getElementById('loader').style.display = 'flex';
      document.getElementById('dashboard').style.display = 'none';
      return;
    }

    document.getElementById('loader').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    // Merge all machines
    const merged = TD.mergeStats(machines);
    const { models, totals } = TD.computeCosts(merged.modelUsage);
    const daySpan = TD.computeDaySpan(merged);
    const dietDaySpan = TD.computeDietDaySpan(merged);
    const firstDate = merged.firstSessionDate ? new Date(merged.firstSessionDate) : new Date();
    const lastDate = merged.lastComputedDate ? new Date(merged.lastComputedDate + 'T00:00:00') : new Date();

    // Destroy previous charts
    TD.destroyCharts();

    // Machine bar
    renderMachineBar(machines);

    // Summary cards
    renderSummaryCards(totals, merged, daySpan, firstDate, lastDate, count);

    // Charts
    TD.renderDailyChart('dailyChart', merged.dailyModelTokens);
    TD.renderModelChart('modelChart', models, totals.cost);
    TD.renderActivityChart('activityChart', merged.dailyActivity);
    TD.renderHourChart('hourChart', merged.hourCounts);

    // Tables
    renderCostTable(models, totals);
    renderTokenTable(models, totals);

    // Per-machine breakdown (when 2+)
    renderMachineBreakdown(machines);

    // Burger
    renderBurger(totals, daySpan, dietDaySpan);

    // Animate counters after a tick
    setTimeout(function() { animateAllCounters(totals, merged, daySpan); }, 120);
  }

  // ── Machine bar ──
  function renderMachineBar(machines) {
    const bar = document.getElementById('machineBar');
    const names = Object.keys(machines).sort();
    let html = '';

    for (const name of names) {
      const entry = machines[name];
      const ago = TD.timeAgo(entry.loadedAt);
      html += `<div class="machine-pill">
        <span class="machine-pill-dot"></span>
        <span class="machine-pill-name">${esc(name)}</span>
        <span class="machine-pill-ago">${ago}</span>
        <button class="machine-pill-update" title="Update" onclick="TD.app.updateMachine('${esc(name)}')">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 8a5.5 5.5 0 0 1 9.3-4M13.5 8a5.5 5.5 0 0 1-9.3 4"/><path d="M12.5 1.5v3h-3M3.5 14.5v-3h3"/></svg>
        </button>
        <button class="machine-pill-remove" title="Remove" onclick="TD.app.removeMachine('${esc(name)}')">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg>
        </button>
      </div>`;
    }

    bar.innerHTML = html + `<button class="add-machine-btn" onclick="TD.app.addMachine()">+ Add Machine</button>`;
  }

  // ── Summary cards ──
  function renderSummaryCards(totals, merged, daySpan, firstDate, lastDate, machineCount) {
    document.getElementById('summaryCards').innerHTML = `
      <div class="card">
        <div class="card-label">Total Tokens</div>
        <div class="card-value" id="ctrTokens">0</div>
        <div class="card-sub">${TD.fmt(totals.output)} out &middot; ${TD.fmt(totals.input)} in</div>
      </div>
      <div class="card">
        <div class="card-label">API Cost Equiv.</div>
        <div class="card-value red" id="ctrCost">$0</div>
        <div class="card-sub">${TD.fmtUSD(totals.cost / daySpan)}/day avg</div>
      </div>
      <div class="card">
        <div class="card-label">Sessions</div>
        <div class="card-value accent" id="ctrSessions">0</div>
        <div class="card-sub">${merged.totalMessages.toLocaleString()} messages &middot; ${machineCount} machine${machineCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="card">
        <div class="card-label">Time Span</div>
        <div class="card-value" id="ctrDays">0</div>
        <div class="card-sub">${TD.fmtDateRange(firstDate)} &ndash; ${TD.fmtDateRange(lastDate)}</div>
      </div>`;
  }

  function animateAllCounters(totals, merged, daySpan) {
    const ctrTokens = document.getElementById('ctrTokens');
    TD.animateCounter(ctrTokens, totals.tokens, '', '', 1200);
    setTimeout(function() { if (ctrTokens) ctrTokens.textContent = TD.fmt(totals.tokens); }, 1300);
    TD.animateCounter(document.getElementById('ctrCost'), totals.cost, '$');
    TD.animateCounter(document.getElementById('ctrSessions'), merged.totalSessions);
    TD.animateCounter(document.getElementById('ctrDays'), daySpan, '', 'd');
  }

  // ── Cost table ──
  function renderCostTable(models, totals) {
    let html = `<table><tr><th>Model</th><th class="right">Input</th><th class="right">Output</th><th class="right">Cache Read</th><th class="right">Cache Write</th><th class="right">Total</th></tr>`;
    for (const [label, c] of Object.entries(models)) {
      html += `<tr>
        <td class="label-cell"><span class="model-dot" style="background:${c.color}"></span>${esc(label)}</td>
        <td class="right">${TD.fmtUSD(c.inputCost)}</td><td class="right">${TD.fmtUSD(c.outputCost)}</td>
        <td class="right">${TD.fmtUSD(c.cacheReadCost)}</td><td class="right">${TD.fmtUSD(c.cacheWriteCost)}</td>
        <td class="right">${TD.fmtUSD(c.subtotal)}</td></tr>`;
    }
    const sums = Object.values(models).reduce(function(a, c) {
      return { i: a.i + c.inputCost, o: a.o + c.outputCost, r: a.r + c.cacheReadCost, w: a.w + c.cacheWriteCost };
    }, { i: 0, o: 0, r: 0, w: 0 });
    html += `<tr class="total-row"><td class="label-cell">Total</td><td class="right">${TD.fmtUSD(sums.i)}</td><td class="right">${TD.fmtUSD(sums.o)}</td><td class="right">${TD.fmtUSD(sums.r)}</td><td class="right">${TD.fmtUSD(sums.w)}</td><td class="right">${TD.fmtUSD(totals.cost)}</td></tr></table>`;
    document.getElementById('costTable').innerHTML = html;
  }

  // ── Token table ──
  function renderTokenTable(models, totals) {
    let html = `<table><tr><th>Model</th><th class="right">Input</th><th class="right">Output</th><th class="right">Cache Read</th><th class="right">Cache Write</th><th class="right">Total</th></tr>`;
    for (const [label, c] of Object.entries(models)) {
      const t = c.input + c.output + c.cacheRead + c.cacheWrite;
      html += `<tr>
        <td class="label-cell"><span class="model-dot" style="background:${c.color}"></span>${esc(label)}</td>
        <td class="right">${TD.fmt(c.input)}</td><td class="right">${TD.fmt(c.output)}</td>
        <td class="right">${TD.fmt(c.cacheRead)}</td><td class="right">${TD.fmt(c.cacheWrite)}</td>
        <td class="right">${TD.fmt(t)}</td></tr>`;
    }
    html += `<tr class="total-row"><td class="label-cell">Total</td><td class="right">${TD.fmt(totals.input)}</td><td class="right">${TD.fmt(totals.output)}</td><td class="right">${TD.fmt(totals.cacheRead)}</td><td class="right">${TD.fmt(totals.cacheWrite)}</td><td class="right">${TD.fmt(totals.tokens)}</td></tr></table>`;
    document.getElementById('tokenTable').innerHTML = html;
  }

  // ── Per-machine breakdown ──
  function renderMachineBreakdown(machines) {
    const el = document.getElementById('machineBreakdown');
    const names = Object.keys(machines).sort();
    if (names.length < 2) { el.style.display = 'none'; return; }

    el.style.display = 'block';
    let html = `<table><tr><th>Machine</th><th class="right">Sessions</th><th class="right">Messages</th><th class="right">Tokens</th><th class="right">Est. Cost</th></tr>`;

    for (const name of names) {
      const d = machines[name].data;
      const { totals } = TD.computeCosts(d.modelUsage);
      html += `<tr>
        <td class="label-cell">${esc(name)}</td>
        <td class="right">${d.totalSessions || 0}</td>
        <td class="right">${TD.fmt(d.totalMessages || 0)}</td>
        <td class="right">${TD.fmt(totals.tokens)}</td>
        <td class="right">${TD.fmtUSD(totals.cost)}</td></tr>`;
    }
    html += '</table>';
    document.getElementById('machineTable').innerHTML = html;
  }

  // ── Burger section ──
  var burgerTiers = null;
  var currentTier = 'moderate';

  function renderBurger(totals, daySpan, dietDaySpan) {
    burgerTiers = TD.computeBurger(totals, daySpan, dietDaySpan);
    currentTier = 'moderate';
    renderBurgerTier();
  }

  function renderBurgerTier() {
    var b = burgerTiers[currentTier];
    var lo = burgerTiers.conservative;
    var hi = burgerTiers.generous;
    var positive = b.netCO2 > 0;

    var zone = document.getElementById('burgerZone');
    zone.className = 'burger-zone' + (positive ? '' : ' net-negative');

    var barPct = Math.min(b.pctUsed, 100);

    // Range strings for display
    var aiRange = lo.aiCO2.toFixed(1) + '–' + hi.aiCO2.toFixed(1);
    var burgerRange = lo.aiBurgers.toFixed(1) + '–' + hi.aiBurgers.toFixed(1);

    zone.innerHTML =
      '<div class="burger-header">' +
        '<div class="burger-tagline">' + (positive ? 'Plant-Powered Net Positive' : 'Offset Exceeded') + '</div>' +
        '<div class="burger-headline">Your AI runs on ' + burgerRange + ' burgers of CO&#8322;</div>' +
        '<div class="burger-body">' + (positive
          ? 'Using ' + b.tier + ' estimates, Claude inference generated ~<strong>' + b.aiCO2.toFixed(1) + ' kg CO&#8322;</strong> (range: ' + aiRange + '). Over ' + b.dietDaySpan + ' days plant-based, you skipped ~' + b.dietBurgers + ' burgers worth <strong>' + b.dietCO2.toFixed(1) + ' kg CO&#8322;</strong>. Your diet covers your AI footprint <strong>' + b.ratio.toFixed(1) + 'x over</strong>.'
          : 'Using ' + b.tier + ' estimates, Claude inference generated ~<strong>' + b.aiCO2.toFixed(1) + ' kg CO&#8322;</strong> (range: ' + aiRange + '), exceeding the <strong>' + b.dietCO2.toFixed(1) + ' kg CO&#8322;</strong> saved by skipping ~' + b.dietBurgers + ' burgers over ' + b.dietDaySpan + ' days.'
        ) + '</div>' +
      '</div>' +

      // Tier toggle
      '<div class="tier-toggle">' +
        '<button class="tier-btn' + (currentTier === 'conservative' ? ' active' : '') + '" onclick="TD.app.setTier(\'conservative\')">Conservative</button>' +
        '<button class="tier-btn' + (currentTier === 'moderate' ? ' active' : '') + '" onclick="TD.app.setTier(\'moderate\')">Moderate</button>' +
        '<button class="tier-btn' + (currentTier === 'generous' ? ' active' : '') + '" onclick="TD.app.setTier(\'generous\')">Generous</button>' +
      '</div>' +

      // Budget bar
      '<div class="budget-bar">' +
        '<div class="budget-labels">' +
          '<span>AI used <strong>' + b.pctUsed.toFixed(0) + '%</strong> of diet savings</span>' +
          '<span class="budget-label-right">' + b.dietCO2.toFixed(1) + ' kg saved</span>' +
        '</div>' +
        '<div class="budget-track">' +
          '<div class="budget-fill" style="width:0%" data-target="' + barPct + '"></div>' +
        '</div>' +
        '<div class="budget-legend">' +
          '<span class="budget-legend-item"><span class="legend-dot" style="background:var(--orange)"></span>' + b.aiCO2.toFixed(1) + ' kg AI</span>' +
          '<span class="budget-legend-item"><span class="legend-dot" style="background:var(--green)"></span>' + Math.max(0, b.dietCO2 - b.aiCO2).toFixed(1) + ' kg net saved</span>' +
        '</div>' +
      '</div>' +

      // Range table
      '<div class="range-table-wrap">' +
        '<table class="range-table">' +
          '<tr><th></th><th class="right">Conservative</th><th class="right">Moderate</th><th class="right">Generous</th></tr>' +
          '<tr><td class="label-cell">AI CO&#8322;</td><td class="right">' + lo.aiCO2.toFixed(1) + ' kg</td><td class="right">' + burgerTiers.moderate.aiCO2.toFixed(1) + ' kg</td><td class="right">' + hi.aiCO2.toFixed(1) + ' kg</td></tr>' +
          '<tr><td class="label-cell">AI Burgers</td><td class="right">' + lo.aiBurgers.toFixed(1) + '</td><td class="right">' + burgerTiers.moderate.aiBurgers.toFixed(1) + '</td><td class="right">' + hi.aiBurgers.toFixed(1) + '</td></tr>' +
          '<tr><td class="label-cell">Diet Savings</td><td class="right">' + lo.dietCO2.toFixed(1) + ' kg</td><td class="right">' + burgerTiers.moderate.dietCO2.toFixed(1) + ' kg</td><td class="right">' + hi.dietCO2.toFixed(1) + ' kg</td></tr>' +
          '<tr><td class="label-cell">Diet : AI</td><td class="right">' + lo.ratio.toFixed(1) + 'x</td><td class="right">' + burgerTiers.moderate.ratio.toFixed(1) + 'x</td><td class="right">' + hi.ratio.toFixed(1) + 'x</td></tr>' +
          '<tr><td class="label-cell">Est. kWh</td><td class="right">' + lo.energyKWh.toFixed(1) + '</td><td class="right">' + burgerTiers.moderate.energyKWh.toFixed(1) + '</td><td class="right">' + hi.energyKWh.toFixed(1) + '</td></tr>' +
        '</table>' +
      '</div>' +

      // Stat row (selected tier)
      '<div class="burger-stat-row">' +
        '<div class="burger-stat">' +
          '<div class="num" style="color:var(--orange)" id="ctrAiBurgers">0</div>' +
          '<div class="lbl">AI Burgers</div>' +
        '</div>' +
        '<div class="burger-stat">' +
          '<div class="num" style="color:var(--green)" id="ctrDietBurgers">0</div>' +
          '<div class="lbl">Burgers Skipped</div>' +
        '</div>' +
        '<div class="burger-stat">' +
          '<div class="num" style="color:' + (positive ? 'var(--green)' : 'var(--red)') + '" id="ctrRatio">0</div>' +
          '<div class="lbl">Diet : AI Ratio</div>' +
        '</div>' +
        '<div class="burger-stat">' +
          '<div class="num" style="color:var(--blue)" id="ctrKwh">0</div>' +
          '<div class="lbl">Est. kWh</div>' +
        '</div>' +
      '</div>' +

      '<details class="methodology">' +
        '<summary>Methodology &amp; Sources</summary>' +
        '<p><strong>3-tier estimates:</strong> Each figure is computed under Conservative, Moderate, and Generous assumptions. The range reflects genuine uncertainty in these measurements — not sloppiness.</p>' +
        '<p><strong>API Pricing:</strong> Anthropic official pricing (Mar 2026). Opus: $5/$25/$0.50/$6.25 per MTok. Sonnet: $3/$15/$0.30/$3.75. Haiku: $0.80/$4/$0.08/$1.</p>' +
        '<p><strong>Energy per token (moderate):</strong> ~1 kWh/MTok output, ~0.3 input, ~0.02 cache reads. Conservative: 0.4/0.1/0.005 (optimized H100 cluster). Generous: 2.0/0.6/0.05 (large context, low batch). Sources: TokenPowerBench (arxiv 2024), Muxup (2026), John Snow Labs.</p>' +
        '<p><strong>CO&#8322; per kWh:</strong> Conservative: 0.28 kg (renewable-heavy data center). Moderate: 0.42 kg (US grid avg, EPA eGRID 2024). Generous: 0.55 kg (higher-carbon grid regions).</p>' +
        '<p><strong>Burger footprint:</strong> Conservative: 2.5 kg (feedlot, GWP100, no land-use change — NCBA). Moderate: 4.5 kg (full lifecycle US beef — Poore &amp; Nemecek 2018, Nature Food 2024). Generous: 6.5 kg (full LCA + LUC + GWP20 methane — Oxford LEAP, Carlsson-Kanyama upper end).</p>' +
        '<p><strong>Burgers skipped per week:</strong> Conservative: 0.65 (NHANES dietary recall — PMC11194417). Moderate: 1.0 (USDA ERS per-capita beef, ground-beef-to-burger conversion). Generous: 3.0 (all-burger types, industry aggregate — NRA).</p>' +
        '<p><strong>Key correction:</strong> The commonly cited "2.4 burgers/week" conflates all burger types and uses industry marketing data. The peer-reviewed moderate estimate for beef-specifically is ~1.0/week (USDA ERS loss-adjusted data).</p>' +
        '<p><strong>Caveats:</strong> Token-to-energy estimates vary 10x+ by hardware, batch size, and PUE. The range shown here captures most of that uncertainty. Anthropic\'s actual data center efficiency is not public.</p>' +
      '</details>';

    // Animate
    setTimeout(function() {
      var fill = zone.querySelector('.budget-fill');
      if (fill) fill.style.width = fill.dataset.target + '%';
      TD.animateCounter(document.getElementById('ctrAiBurgers'), parseFloat(b.aiBurgers.toFixed(1)));
      TD.animateCounter(document.getElementById('ctrDietBurgers'), b.dietBurgers);
      TD.animateCounter(document.getElementById('ctrRatio'), parseFloat(b.ratio.toFixed(1)), '', 'x');
      TD.animateCounter(document.getElementById('ctrKwh'), parseFloat(b.energyKWh.toFixed(1)));
    }, 200);
  }

  // ── Helpers ──
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // ── Public API (called from onclick handlers) ──
  let updateTarget = null;

  TD.app = {
    addMachine: function() {
      updateTarget = null;
      document.getElementById('fileInput').click();
    },
    updateMachine: function(name) {
      updateTarget = name;
      document.getElementById('fileInput').click();
    },
    removeMachine: function(name) {
      if (!confirm('Remove "' + name + '"? Data will be cleared from this browser.')) return;
      TD.storage.remove(name);
      renderDashboard();
      showToast(name + ' removed');
    },
    pickFile: function() {
      updateTarget = null;
      document.getElementById('fileInput').click();
    },
    setTier: function(tier) {
      currentTier = tier;
      renderBurgerTier();
    },
  };

  // Intercept file handler to support update mode
  const origHandleFile = handleFile;
  handleFile = function(file) {
    if (updateTarget) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.modelUsage) throw new Error('Missing modelUsage');
          TD.storage.set(updateTarget, data);
          updateTarget = null;
          renderDashboard();
          showToast('Updated');
        } catch (err) { showToast('Failed: ' + err.message, true); }
      };
      reader.readAsText(file);
    } else {
      origHandleFile(file);
    }
  };

})();
