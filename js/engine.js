/**
 * Data processing: cost calculation, multi-file merging, burger math.
 */

/**
 * Compute per-model costs from a modelUsage object.
 * Returns { models: { label: { ...costs } }, totals: { cost, tokens, ... } }
 */
TD.computeCosts = function(modelUsage) {
  const models = {};
  let totalCost = 0, totalOutput = 0, totalInput = 0, totalCacheRead = 0, totalCacheWrite = 0;

  for (const [modelId, u] of Object.entries(modelUsage)) {
    const p = TD.getModelPricing(modelId);
    const label = TD.getModelLabel(modelId);
    const inputCost      = (u.inputTokens / 1e6) * p.input;
    const outputCost     = (u.outputTokens / 1e6) * p.output;
    const cacheReadCost  = (u.cacheReadInputTokens / 1e6) * p.cacheRead;
    const cacheWriteCost = (u.cacheCreationInputTokens / 1e6) * p.cacheWrite;
    const subtotal       = inputCost + outputCost + cacheReadCost + cacheWriteCost;

    models[label] = {
      modelId, color: TD.getModelColor(modelId),
      input: u.inputTokens, output: u.outputTokens,
      cacheRead: u.cacheReadInputTokens, cacheWrite: u.cacheCreationInputTokens,
      inputCost, outputCost, cacheReadCost, cacheWriteCost, subtotal,
    };

    totalCost += subtotal;
    totalOutput += u.outputTokens;
    totalInput += u.inputTokens;
    totalCacheRead += u.cacheReadInputTokens;
    totalCacheWrite += u.cacheCreationInputTokens;
  }

  return {
    models,
    totals: {
      cost: totalCost,
      output: totalOutput,
      input: totalInput,
      cacheRead: totalCacheRead,
      cacheWrite: totalCacheWrite,
      tokens: totalOutput + totalInput + totalCacheRead + totalCacheWrite,
    },
  };
};

/**
 * Merge multiple stats-cache objects into a single unified view.
 */
TD.mergeStats = function(machineMap) {
  const names = Object.keys(machineMap);
  if (names.length === 0) return null;
  if (names.length === 1) return machineMap[names[0]].data;

  const merged = {
    version: 2,
    dailyActivity: [],
    dailyModelTokens: [],
    modelUsage: {},
    totalSessions: 0,
    totalMessages: 0,
    firstSessionDate: null,
    lastComputedDate: null,
    hourCounts: {},
  };

  // Temp maps for merging daily data by date
  const activityByDate = {};
  const tokensByDate = {};

  for (const name of names) {
    const d = machineMap[name].data;

    // modelUsage: sum per model
    for (const [modelId, u] of Object.entries(d.modelUsage || {})) {
      if (!merged.modelUsage[modelId]) {
        merged.modelUsage[modelId] = { inputTokens: 0, outputTokens: 0, cacheReadInputTokens: 0, cacheCreationInputTokens: 0 };
      }
      merged.modelUsage[modelId].inputTokens += u.inputTokens || 0;
      merged.modelUsage[modelId].outputTokens += u.outputTokens || 0;
      merged.modelUsage[modelId].cacheReadInputTokens += u.cacheReadInputTokens || 0;
      merged.modelUsage[modelId].cacheCreationInputTokens += u.cacheCreationInputTokens || 0;
    }

    // dailyActivity: merge by date
    for (const day of (d.dailyActivity || [])) {
      if (!activityByDate[day.date]) {
        activityByDate[day.date] = { date: day.date, messageCount: 0, sessionCount: 0, toolCallCount: 0 };
      }
      activityByDate[day.date].messageCount += day.messageCount || 0;
      activityByDate[day.date].sessionCount += day.sessionCount || 0;
      activityByDate[day.date].toolCallCount += day.toolCallCount || 0;
    }

    // dailyModelTokens: merge by date + model
    for (const day of (d.dailyModelTokens || [])) {
      if (!tokensByDate[day.date]) tokensByDate[day.date] = {};
      for (const [model, count] of Object.entries(day.tokensByModel || {})) {
        tokensByDate[day.date][model] = (tokensByDate[day.date][model] || 0) + count;
      }
    }

    // Scalars
    merged.totalSessions += d.totalSessions || 0;
    merged.totalMessages += d.totalMessages || 0;

    // Dates
    if (d.firstSessionDate) {
      if (!merged.firstSessionDate || new Date(d.firstSessionDate) < new Date(merged.firstSessionDate)) {
        merged.firstSessionDate = d.firstSessionDate;
      }
    }
    if (d.lastComputedDate) {
      if (!merged.lastComputedDate || d.lastComputedDate > merged.lastComputedDate) {
        merged.lastComputedDate = d.lastComputedDate;
      }
    }

    // hourCounts
    for (const [h, c] of Object.entries(d.hourCounts || {})) {
      merged.hourCounts[h] = (merged.hourCounts[h] || 0) + c;
    }
  }

  // Flatten maps to sorted arrays
  merged.dailyActivity = Object.values(activityByDate).sort((a, b) => a.date.localeCompare(b.date));
  merged.dailyModelTokens = Object.keys(tokensByDate).sort().map(date => ({
    date,
    tokensByModel: tokensByDate[date],
  }));

  return merged;
};

/**
 * Compute burger / environmental metrics.
 */
TD.computeBurger = function(totals, daySpan) {
  const E = TD.ENV;
  const outputMTok    = totals.output / 1e6;
  const inputMTok     = totals.input / 1e6;
  const cacheWriteMTok = totals.cacheWrite / 1e6;
  const cacheReadMTok = totals.cacheRead / 1e6;

  const energyKWh = outputMTok * E.KWH_PER_MTOK_OUTPUT
                   + (inputMTok + cacheWriteMTok) * E.KWH_PER_MTOK_INPUT
                   + cacheReadMTok * E.KWH_PER_MTOK_CACHE_READ;

  const aiCO2       = energyKWh * E.KG_CO2_PER_KWH;
  const aiBurgers   = aiCO2 / E.KG_CO2_PER_BURGER;
  const weeksSpan   = daySpan / 7;
  const dietBurgers = Math.round(weeksSpan * E.AVG_BURGERS_PER_WEEK);
  const dietCO2     = dietBurgers * E.KG_CO2_PER_BURGER;
  const netCO2      = dietCO2 - aiCO2;
  const ratio       = dietCO2 > 0 ? dietCO2 / aiCO2 : 0;
  const pctUsed     = dietCO2 > 0 ? (aiCO2 / dietCO2) * 100 : 0;

  return { energyKWh, aiCO2, aiBurgers, dietBurgers, dietCO2, netCO2, ratio, pctUsed };
};

/**
 * Compute the date span in days from a stats object.
 */
TD.computeDaySpan = function(data) {
  const first = data.firstSessionDate ? new Date(data.firstSessionDate) : new Date();
  const last  = data.lastComputedDate ? new Date(data.lastComputedDate + 'T00:00:00') : new Date();
  return Math.max(1, Math.round((last - first) / 86400000));
};
