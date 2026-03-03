/**
 * Pricing tables, environmental constants, and model metadata.
 */
window.TD = window.TD || {};
var TD = window.TD;

TD.PRICING = {
  'claude-opus-4-5-20251101':   { input: 5.00, output: 25.00, cacheRead: 0.50, cacheWrite: 6.25,  label: 'Opus 4.5',   color: '#7c5cbf' },
  'claude-opus-4-6':            { input: 5.00, output: 25.00, cacheRead: 0.50, cacheWrite: 6.25,  label: 'Opus 4.6',   color: '#a78bfa' },
  'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75,  label: 'Sonnet 4.5', color: '#4da2f7' },
  'claude-sonnet-4-6-20260320': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75,  label: 'Sonnet 4.6', color: '#7cc4fa' },
  'claude-haiku-4-5-20251001':  { input: 0.80, output:  4.00, cacheRead: 0.08, cacheWrite: 1.00,  label: 'Haiku 4.5',  color: '#3dd68c' },
};

TD.DEFAULT_PRICING = { input: 5.00, output: 25.00, cacheRead: 0.50, cacheWrite: 6.25, color: '#888' };

/**
 * 3-tier environmental estimates.
 *
 * Conservative: optimistic for AI, pessimistic for burger impact.
 *   Efficient data center, low grid carbon, industry-friendly beef LCA.
 * Moderate: central peer-reviewed estimates.
 *   US-average grid, standard LCA beef, mid-range inference energy.
 * Generous: pessimistic for AI, optimistic for burger impact.
 *   High inference cost, dirtier grid, full-lifecycle beef with LUC.
 *
 * Sources in methodology section of the UI.
 */
TD.ENV_TIERS = {
  conservative: {
    label: 'Conservative',
    KWH_PER_MTOK_OUTPUT:     0.4,   // Optimized H100 cluster, high batch — TokenPowerBench low end
    KWH_PER_MTOK_INPUT:      0.1,   // Parallel input cheaper than output
    KWH_PER_MTOK_CACHE_READ: 0.005, // Near-pure memory lookup
    KG_CO2_PER_KWH:          0.28,  // Clean-grid data center (Google/AWS renewables mix)
    KG_CO2_PER_BURGER:       2.5,   // Feedlot beef, GWP100, cradle-to-retail, no LUC — NCBA
    AVG_BURGERS_PER_WEEK:    0.65,  // NHANES dietary recall prevalence — PMC11194417
  },
  moderate: {
    label: 'Moderate',
    KWH_PER_MTOK_OUTPUT:     1.0,   // Frontier model, reasonable batch — Muxup 2026, John Snow Labs
    KWH_PER_MTOK_INPUT:      0.3,   // ~30% of output cost
    KWH_PER_MTOK_CACHE_READ: 0.02,  // ~2% of output cost
    KG_CO2_PER_KWH:          0.42,  // US grid average — EPA eGRID 2024
    KG_CO2_PER_BURGER:       4.5,   // Full lifecycle US beef cheeseburger — Poore & Nemecek, Nature Food 2024
    AVG_BURGERS_PER_WEEK:    1.0,   // USDA ERS per-capita beef, ground-beef-to-burger conversion
  },
  generous: {
    label: 'Generous',
    KWH_PER_MTOK_OUTPUT:     2.0,   // Large context, low batch, older GPU — upper range estimates
    KWH_PER_MTOK_INPUT:      0.6,   // Proportional to output
    KWH_PER_MTOK_CACHE_READ: 0.05,  // Including memory + overhead
    KG_CO2_PER_KWH:          0.55,  // Higher-carbon grid regions (EPA eGRID state-level upper quartile)
    KG_CO2_PER_BURGER:       6.5,   // Full LCA + LUC + GWP20 methane + waste — Oxford LEAP, Carlsson-Kanyama upper
    AVG_BURGERS_PER_WEEK:    3.0,   // All-burger types, industry aggregate — NRA / trade sources
  },
};

// Default tier
TD.ENV_DEFAULT_TIER = 'moderate';

// Convenience: get current tier's constants
TD.getEnv = function(tier) {
  return TD.ENV_TIERS[tier || TD.ENV_DEFAULT_TIER];
};

TD.getModelLabel = function(id) {
  return TD.PRICING[id]?.label || id.replace('claude-', '').replace(/-\d{8}$/, '');
};

TD.getModelColor = function(id) {
  return TD.PRICING[id]?.color || TD.DEFAULT_PRICING.color;
};

TD.getModelPricing = function(id) {
  return TD.PRICING[id] || { ...TD.DEFAULT_PRICING, label: TD.getModelLabel(id) };
};
