/**
 * Formatting helpers and animation utilities.
 */
const TD = window.TD || {};

TD.fmt = function(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
};

TD.fmtUSD = function(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

TD.fmtDate = function(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

TD.fmtDateRange = function(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Animate a number counting up from 0.
 * @param {HTMLElement} el
 * @param {number} target
 * @param {string} prefix
 * @param {string} suffix
 * @param {number} duration ms
 */
TD.animateCounter = function(el, target, prefix, suffix, duration) {
  prefix = prefix || '';
  suffix = suffix || '';
  duration = duration || 900;
  if (!el) return;

  const start = performance.now();
  const isFloat = target !== Math.floor(target);

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = target * eased;
    el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + (isFloat ? target.toFixed(1) : target.toLocaleString()) + suffix;
  }
  requestAnimationFrame(tick);
};

/**
 * Generate a short relative time string.
 */
TD.timeAgo = function(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  return days + 'd ago';
};

window.TD = TD;
