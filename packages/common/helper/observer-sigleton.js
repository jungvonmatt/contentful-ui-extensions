/**
 * Helper method to observe/watch and react to entity changes
 *
 * Copyright (c) Jung von Matt/TECH
 */

let timeout = undefined;
let pingTimeout = undefined;
const instanceId = `instance-${Math.round(Math.random() * 1000000)}-${new Date().getTime()}`;
let lastTime = new Date().getTime();
// Limit to 12 calls in 1 minute to not exceed the API quota of 20000000 calls
// See https://www.contentful.com/r/knowledgebase/fair-use/
const OBSERVER_INTERVAL = 5000;
const CLEANUP_INTERVAL = 30000;
const CLEANUP_THRESHOLD = 50000;

const OBSERVABLE_INSTANCE = 'cf-observe-instance';

const callbacks = {};
const local = {};

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * @param {function} func The function to throttle.
 * @param {number} wait The number of milliseconds to throttle invocations to.
 */
const throttle = (func, wait = 0) => {
  let time = undefined;

  return (...args) => {
    const now = new Date().getTime();
    if (typeof time === 'undefined') {
      time = now;
    }
    if (time + wait < now) {
      func(...args);
      time = now;
    }
  };
};

/**
 * Store data JSON Stringified in localstorage
 * @param {string} key
 * @param {*} value
 */
const store = (key, value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

/**
 * Try to load data from localstorage
 * @param {string} key
 * @param {*} defaultValue
 */
const load = (key, defaultValue) => {
  if (typeof localStorage === 'undefined' || !Object.keys(localStorage).includes(key)) {
    return defaultValue;
  }

  const value = localStorage.getItem(key);
  try {
    return JSON.parse(value);
  } catch (error) {
    console.log(`LocalStorage error for "${key}":`, { message: error.message, value });
    return defaultValue;
  }
};

/**
 * Write last run time to localstorage
 * @returns {void}
 */
const updateRunner = () => {
  store('cf-observe-time', new Date().getTime());
};

/**
 * Check if the last runtime is less than OBSERVER_INTERVAL milliseconds in the past
 * @returns {boolean}
 */
const isRunning = () => {
  const last = load('cf-observe-time', 0);
  const now = new Date().getTime();
  return now - last < OBSERVER_INTERVAL;
};

/**
 * Get type from object
 * @param {object} obj Contentful object
 * @returns {string} Could be "Entry" or "Asset"
 */
const getType = obj => {
  const { sys } = obj || {};
  const { type = '', linkType } = sys || {};
  const result = type === 'Link' ? linkType : type;
  return result || '';
};

/**
 * Ping localstorage so the cleanup task knows we're still alive
 * @returns {void}
 */
const ping = () => {
  if (pingTimeout) {
    window.clearTimeout(pingTimeout);
  }

  const instances = load(OBSERVABLE_INSTANCE, {});
  const { [instanceId]: instance = {} } = instances || {};
  instances[instanceId] = { ...instance, ping: new Date().getTime() };
  store(OBSERVABLE_INSTANCE, instances);

  window.setTimeout(() => {
    ping();
  }, OBSERVER_INTERVAL);
};

/**
 * Cleanup outdated ids in observable lists
 */
const cleanup = throttle(() => {
  const instances = load(OBSERVABLE_INSTANCE, {});
  const now = new Date().getTime();
  // Get ids from instances which pinged recently
  const freshInstanceIds = Object.keys(instances).filter(key => {
    const { ping } = instances[key] || { ping: now };
    return ping + CLEANUP_THRESHOLD > now;
  });

  // Get all the observed ids from the instance
  const freshItemIds = freshInstanceIds.flatMap(key => instances[key].ids || []);

  // Get all ids from outdated instances
  const outdatedItemIds = Object.keys(instances).flatMap(key => {
    if (freshInstanceIds.includes(key)) {
      return [];
    }
    const ids = instances[key].ids || [];
    // remove from instance list
    return ids.filter(id => !freshItemIds.includes(id));
  });

  if (outdatedItemIds.length) {
    console.log('Removing the following outdated ids:', outdatedItemIds);
    // cleanup observable ids
    const { entries, assets } = getObservables();
    store(
      'cf-observed-asset',
      assets.filter(id => !outdatedItemIds.includes(id))
    );
    store(
      'cf-observed-entry',
      entries.filter(id => !outdatedItemIds.includes(id))
    );

    // cleanup single entries
    outdatedItemIds.forEach(id => {
      if (entries.includes(id)) {
        localStorage.removeItem(`cf-observed-entry-${id}`);
      }
      if (assets.includes(id)) {
        localStorage.removeItem(`cf-observed-asset-${id}`);
      }
    });
  }

  // Remove outdated instances
  const cleanInstances = Object.keys(instances).reduce((result, key) => {
    if (freshInstanceIds.includes(key)) {
      return { ...result, [key]: instances[key] };
    }
    console.log('Removing outdated instance', key);
    return result;
  }, {});
  store(OBSERVABLE_INSTANCE, cleanInstances);
}, CLEANUP_INTERVAL);

/**
 * Get local storage key
 * @param {Object} obj
 */
const getSingleKey = obj => {
  const { sys } = obj || {};
  const { id } = sys || {};
  const type = getType(obj).toLowerCase();

  return `cf-observed-${type}-${id}`;
};

/**
 * Update single item in localstorage (stores "publishedAt" and "updatedAt")
 * @param {object} obj Contentful object
 */
const updateSingleItem = obj => {
  const { sys } = obj || {};
  const { publishedAt, updatedAt } = sys || {};
  const key = getSingleKey(obj);
  const data = { publishedAt, updatedAt };

  store(key, data);
};

/**
 * Removes single item from localstorage
 * @param {object} obj Contentful object
 */
const removeSingleItem = obj => {
  const key = getSingleKey(obj);
  localStorage.removeItem(key);
};

/**
 * Retrieve single item from localstorage
 * @param {object} obj Contentful object
 * @returns {object} Returns { publishedAt, updatedAt }
 */
const getSingleItem = obj => {
  const key = getSingleKey(obj);
  return load(key);
};

/**
 * Start observing an entry/asset
 * @param {object} obj Contentful object
 */
const addObservable = obj => {
  const { sys } = obj || {};
  const { id } = sys || {};
  const type = getType(obj).toLowerCase();

  const key = `cf-observed-${type}`;
  const items = load(key, []);

  // Add id to instance list
  const instances = load(OBSERVABLE_INSTANCE, {});
  const { [instanceId]: instance = {} } = instances || {};
  const { ids = [] } = instance || {};
  instances[instanceId] = { ...instance, ids: [...new Set([...ids, id])] };
  store(OBSERVABLE_INSTANCE, instances);

  if (!items.includes(id)) {
    updateSingleItem(obj);
    store(key, [...new Set([...items, id])]);
  }
};

/**
 * Stop observing an entry/asset
 * @param {object} obj Contentful object
 */
const removeObservable = (obj, cb) => {
  const { sys } = obj || {};
  const { id } = sys || {};
  const type = getType(obj).toLowerCase();
  const key = `cf-observed-${type}`;
  const items = load(key, []);
  const index = items.indexOf(id);
  const { [id]: callback } = callbacks;
  let remove = false;
  if (!cb || callback === cb) {
    remove = true;
    callbacks[id] = [];
  } else if (Array.isArray(callback)) {
    callbacks[id] = callback.filter(v => v !== cb);
    remove = callbacks[id].length === 0;
  }

  // Remove id from instance list
  const instances = load(OBSERVABLE_INSTANCE, {});
  const { [instanceId]: instance = {} } = instances || {};
  const { ids = [] } = instance || {};
  const i = ids.indexOf(id);
  instances[instanceId] = { ...instance, ids: [...new Set([...ids.slice(0, i), ...ids.slice(i + 1)])] };
  store(OBSERVABLE_INSTANCE, instances);

  if (index !== -1 && remove) {
    removeSingleItem(obj);
    delete local[id];
    store(key, [...items.slice(0, index), ...items.slice(index + 1)]);
  }
};

/**
 * Check if item has changed by comparing updated & published date
 * @param {Object} contentful entity or asset
 */
const check = obj => {
  const { sys } = obj || {};
  const { id, type, publishedAt, updatedAt } = sys || {};
  const { [id]: callback } = callbacks;
  const item = getSingleItem(obj);

  if (item) {
    const { publishedAt: oldPublishedAt, updatedAt: oldUpdatedAt } = item;
    // Nothing changed so we do nothing
    if (oldPublishedAt === publishedAt && oldUpdatedAt === updatedAt) {
      return false;
    }
  }

  // Update the master values & return true to indicate that something has changed
  updateSingleItem(obj);

  if (typeof callback === 'function') {
    callback(obj);
  } else if (Array.isArray(callback)) {
    callback.forEach(cb => cb(obj));
  }
  return true;
};

/**
 * Get all observable ids registered in localstorage
 */
const getObservables = () => {
  const assets = load('cf-observed-asset', []);
  const entries = load('cf-observed-entry', []);

  return { assets, entries };
};

/**
 * Runs checks on all watched items in an intervall
 * @param {object} sdk Contentful SDK
 * @param {number} interval interval
 */
const run = async (sdk, interval = OBSERVER_INTERVAL) => {
  const { space } = sdk;
  const { entries, assets } = getObservables();

  updateRunner();
  window.clearTimeout(timeout);
  const now = new Date().getTime();
  const timeDiff = now - lastTime;
  // console.log(`${instanceId} (after ${timeDiff / 1000}s / ${interval / 1000}s) Checking: `, {
  //   entries: entryIds,
  //   assets: assetIds,
  // });

  const assetIds = [...new Set(assets)];
  const entryIds = [...new Set(entries)];
  lastTime = now;
  if (assetIds.length) {
    try {
      const { items: assets = [] } = await space.getAssets({ 'sys.id[in]': assetIds.join(',') });
      assets.forEach(asset => check(asset));
    } catch (err) {
      console.log('space.getAssets', err);
    }
  }

  if (entryIds.length) {
    try {
      const { items: entries = [] } = await space.getEntries({ 'sys.id[in]': entryIds.join(',') });
      entries.forEach(entry => check(entry));
    } catch (err) {
      console.log('space.getEntries', err);
    }
  }
  cleanup();
  timeout = setTimeout(() => run(sdk, interval), interval);
};

/**
 * Add item to the watchlist and start the runner
 * @param {object} sdk Contentful SDK
 * @param {object} obj Contentful item
 * @param {function} cb Callback function
 * @param {number} interval interval
 */
export const subscribe = (sdk, obj, cb, interval = OBSERVER_INTERVAL) => {
  const { sys } = obj || {};
  const { id } = sys || {};
  const { space } = sdk;

  if (!id) {
    return () => {};
  }

  const { [id]: callback = [] } = callbacks;

  // start pinging
  ping();

  if (!callback.includes(cb)) {
    addObservable(obj);
    callbacks[id] = [...callback, cb];
  } else {
    console.log(`Callback for ${id} already registered`);
  }

  local[id] = sys;

  // start runner if it's not already running
  const start = () => {
    if (!isRunning()) {
      run(sdk, interval);
      return true;
    }

    return false;
  };

  // double check if the observer is running
  if (!start()) {
    window.setTimeout(() => start(), interval + 1000);
  }

  // Add watcher for localStorage changes
  const localStorageCallback = e => {
    const { key, oldValue, newValue } = e;
    if (oldValue === newValue) {
      return;
    }
    if (key === getSingleKey(obj)) {
      const [match, type, id] = /cf-observed-(\w+)-(.*)/.exec(key);
      console.log(`${type} ${id} changed`);
      if (type === 'asset') {
        space.getAsset(id).then(v => cb(v));
      } else if (type === 'entry') {
        space.getEntry(id).then(v => cb(v));
      }
    }
  };

  window.addEventListener('storage', localStorageCallback);

  // return unsubsribe method
  return () => {
    removeObservable(obj, cb);
    window.removeEventListener('storage', localStorageCallback);
  };
};

/**
 * Unsubscribe from watcher
 * @param {object} obj Contentful item
 */
export const unsubscribe = (obj, cb) => {
  if (!obj) {
    Object.keys(local).forEach(key => {
      unsubscribe({ sys: local[key] });
    });
  }

  const { sys } = obj || {};
  const { id, type } = sys || {};

  if (id && type) {
    removeObservable(obj, cb);
  }
};
