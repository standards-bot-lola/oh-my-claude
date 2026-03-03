/**
 * Multi-machine localStorage management.
 *
 * Schema (localStorage key: 'td-machines'):
 * {
 *   "Desktop":  { data: { ...stats-cache }, loadedAt: "ISO string" },
 *   "Laptop":   { data: { ...stats-cache }, loadedAt: "ISO string" },
 * }
 */
/* (TD initialized in config.js) */

TD.STORAGE_KEY = 'td-machines';

TD.storage = {
  /** Get all machines. Returns { name: { data, loadedAt } } */
  getAll: function() {
    try {
      return JSON.parse(localStorage.getItem(TD.STORAGE_KEY)) || {};
    } catch { return {}; }
  },

  /** Get a single machine's entry. */
  get: function(name) {
    return TD.storage.getAll()[name] || null;
  },

  /** Add or update a machine. */
  set: function(name, statsData) {
    const all = TD.storage.getAll();
    all[name] = { data: statsData, loadedAt: new Date().toISOString() };
    localStorage.setItem(TD.STORAGE_KEY, JSON.stringify(all));
  },

  /** Remove a machine. */
  remove: function(name) {
    const all = TD.storage.getAll();
    delete all[name];
    localStorage.setItem(TD.STORAGE_KEY, JSON.stringify(all));
  },

  /** Rename a machine. */
  rename: function(oldName, newName) {
    if (oldName === newName) return;
    const all = TD.storage.getAll();
    if (!all[oldName]) return;
    all[newName] = all[oldName];
    delete all[oldName];
    localStorage.setItem(TD.STORAGE_KEY, JSON.stringify(all));
  },

  /** Get sorted machine names. */
  names: function() {
    return Object.keys(TD.storage.getAll()).sort();
  },

  /** How many machines are loaded. */
  count: function() {
    return Object.keys(TD.storage.getAll()).length;
  },

  /** Clear everything. */
  clear: function() {
    localStorage.removeItem(TD.STORAGE_KEY);
  },
};
