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

/**
 * Dietary profiles — daily CO₂e by diet type.
 *
 * Each profile's kgCO2PerDay is keyed by tier name so it plugs
 * directly into the existing conservative/moderate/generous axis.
 *
 * Savings = (omnivore − chosen) × days.
 *
 * Every value below is read directly off Scarborough et al. 2023 (Nature
 * Food), TABLE 3 — "Dietary GHG emissions by diet group aggregated using the
 * GWP100, GTP100 and GWP20, standardized to 2,000 kcal and by age and gender",
 * GWP100 CO₂e (kg d⁻¹) column, medians over a 1,000-iteration Monte Carlo:
 *
 *     vegan 2.47   vegetarian 4.16   fish-eater 4.74
 *     low-meat 5.37   medium-meat 7.04   high-meat 10.24
 *
 * Use Table 3, NOT Table 2. Table 2 reports the three gases separately (CO₂
 * kg/d, CH₄ g/d, N₂O g/d) and it is tempting to aggregate it yourself with the
 * paper's own factors (CH₄ 27, N₂O 273, IPCC AR6 — stated in its Methods).
 * That is wrong by up to ~5%: these are Monte Carlo MEDIANS, and the median of
 * a sum is not the sum of medians. Deriving from Table 2 gives high-meat 9.76
 * against a published 10.24. Table 3 already did the aggregation correctly.
 *
 * The non-baseline profiles do NOT vary across tiers. The paper's Tables 2-4
 * publish uncertainty intervals for a SINGLE diet group and route between-group
 * comparison to its Figs. 2-3, because the Monte Carlo draws are "highly
 * correlated between diet groups" — so those intervals cannot be differenced.
 * Rather than invent a spread, the tier axis varies the BASELINE instead:
 * conservative compares you to a low meat-eater, moderate to a medium one,
 * generous to a high one.
 *
 * Be honest about what that does: it preserves the ORDERING and direction of
 * the old tiers (widest spread at "generous"), but it changes what the axis
 * MEANS for diet — from an uncertainty band on one quantity to a choice of
 * counterfactual. Note the same tier keys still select AI-energy constants,
 * where they do still mean an uncertainty band.
 *
 * The savings below are differences of published MEDIANS — a point estimate,
 * not an uncertainty-propagated comparison. That is legitimate: the authors do
 * it themselves in the Discussion ("a difference in water use between high
 * meat-eaters and vegans of 480 l d⁻¹" — exactly Table 4's 0.89 − 0.41 m³).
 * What the caveat rules out is differencing the INTERVALS, which we never do.
 *
 * Do NOT cross-check these against the paper's own between-group figures.
 * "Vegan impacts are 25.1% of high meat-eaters'" (abstract; Supplementary
 * Table 9 gives 0.251) is a median of PER-ITERATION ratios computed inside the
 * Monte Carlo — a different estimator. Table 3 gives 2.47/10.24 = 24.1%. The
 * two are not supposed to match, so agreement between them proves nothing.
 *
 * Finally: these are standardized to 2,000 kcal/day AND to the EPIC-Oxford
 * age/gender profile. They are not a free-standing per-person footprint —
 * someone eating 2,500 kcal scales up roughly proportionally. The DIFFERENCE
 * is more robust than either absolute, since both terms scale together.
 *
 * Sources:
 *   Scarborough et al. 2023 (Nature Food) — EPIC-Oxford, 55,504 diets
 *     doi:10.1038/s43016-023-00795-w — open access as PMC10365988, Table 3
 *   Poore & Nemecek 2018 (Science) — meta-analysis, 38,700 farms
 */
TD.DIET_PROFILES = {
  omnivore:    { label: 'Omnivore',    desc: 'Meat-eater (baseline: low/medium/high by tier)', kgCO2PerDay: { conservative: 5.37, moderate: 7.04, generous: 10.24 }, isBaseline: true },
  pescatarian: { label: 'Pescatarian', desc: 'Fish, no meat',           kgCO2PerDay: { conservative: 4.74, moderate: 4.74, generous: 4.74 } },
  vegetarian:  { label: 'Vegetarian',  desc: 'No meat or fish',         kgCO2PerDay: { conservative: 4.16, moderate: 4.16, generous: 4.16 } },
  vegan:       { label: 'Vegan',       desc: 'Fully plant-based',       kgCO2PerDay: { conservative: 2.47, moderate: 2.47, generous: 2.47 } },
};

TD.DIET_DEFAULT_PROFILE = 'vegan';

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
