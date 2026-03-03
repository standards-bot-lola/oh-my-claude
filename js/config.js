/**
 * Pricing tables, environmental constants, and model metadata.
 */
const TD = window.TD || {};

TD.PRICING = {
  'claude-opus-4-5-20251101':   { input: 5.00, output: 25.00, cacheRead: 0.50, cacheWrite: 6.25,  label: 'Opus 4.5',   color: '#7c5cbf' },
  'claude-opus-4-6':            { input: 5.00, output: 25.00, cacheRead: 0.50, cacheWrite: 6.25,  label: 'Opus 4.6',   color: '#a78bfa' },
  'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75,  label: 'Sonnet 4.5', color: '#4da2f7' },
  'claude-sonnet-4-6-20260320': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75,  label: 'Sonnet 4.6', color: '#7cc4fa' },
  'claude-haiku-4-5-20251001':  { input: 0.80, output:  4.00, cacheRead: 0.08, cacheWrite: 1.00,  label: 'Haiku 4.5',  color: '#3dd68c' },
};

TD.DEFAULT_PRICING = { input: 5.00, output: 25.00, cacheRead: 0.50, cacheWrite: 6.25, color: '#888' };

// Energy estimates per million tokens
TD.ENV = {
  KWH_PER_MTOK_OUTPUT:     1.0,   // Active inference (most expensive)
  KWH_PER_MTOK_INPUT:      0.3,   // Input processing / cache creation
  KWH_PER_MTOK_CACHE_READ: 0.02,  // Memory lookups (cheapest)
  KG_CO2_PER_KWH:          0.42,  // US grid average — EPA eGRID 2024
  KG_CO2_PER_BURGER:       4.5,   // Full lifecycle beef cheeseburger
  AVG_BURGERS_PER_WEEK:    2.4,   // US average beef burger consumption — USDA
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

window.TD = TD;
