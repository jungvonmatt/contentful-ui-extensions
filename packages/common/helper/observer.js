/**
 * Helper method to observe/watch and react to entity changes
 *
 * Copyright (c) Jung von Matt/TECH
 */

import { subscribe as internalSubscribe, unsubscribe as internalUnsubscribe } from './observer-sigleton';
let timeout = undefined;
let running = false;

// Limit to 12 calls in 1 minute to not exceed the API quota of 20000000 calls
// See https://www.contentful.com/r/knowledgebase/fair-use/
const OBSERVER_INTERVAL = 5000;

const data = {
  Entry: new Map(),
  Asset: new Map(),
};

/**
 * Check if item has changed by comparing updated & published date
 * @param {Object} contentful entity or asset
 */
const check = obj => {
  const { sys } = obj || {};
  const { id, type, publishedAt, updatedAt } = sys || {};
  const { [type]: items } = data;

  // Fallback callback should not be  called as we're only working on elements from the dataset
  let item = { cb: () => console.log(`${type} with  id ${id} not found`) };
  if (items.has(id)) {
    item = items.get(id);
    const { published, updated } = item;

    // Nothing changed so we do nothing
    if (published === publishedAt && updated === updatedAt) {
      return false;
    }
  }

  // Update the master values & return true to indicate that something has changed
  data[type].set(id, {
    ...item,
    published: publishedAt,
    updated: updatedAt,
  });

  if (typeof item.cb === 'function') {
    console.log(`${type} (${id}) changed, calling callback`);
    item.cb(obj);
  }
  return true;
};

/**
 * Runs checks on all watched items in an intervall
 * @param {object} sdk Contentful SDK
 * @param {number} interval interval
 */
const run = async (sdk, interval = OBSERVER_INTERVAL) => {
  running = true;
  const { space } = sdk;
  const assetIds = Array.from(data.Asset.keys());
  const entryIds = Array.from(data.Entry.keys());

  window.clearTimeout(timeout);

  if (assetIds.length) {
    try {
      const { items: assets = [] } = await space.getAssets({ 'sys.id[in]': assetIds.join(',') });
      assets.forEach(asset => check(asset));
    } catch (err) {
      console.log('space.getAssets', err);
    }
  }

  if (entryIds.length) {
    const { items: entries = [] } = await space.getEntries({ 'sys.id[in]': entryIds.join(',') });
    entries.forEach(entry => check(entry));
  }

  timeout = setTimeout(() => run(sdk, interval), interval);
};

/**
 * Add item to the watchlist and start the runner
 * @param {object} sdk Contentful SDK
 * @param {object} obj Contentful item
 * @param {function} cb Callback function
 * @param {number} interval interval
 */
export const _subscribe = (sdk, obj, cb, interval = OBSERVER_INTERVAL) => {
  const { sys } = obj || {};
  const { id, type, linkType, updatedAt, publishedAt } = sys || {};
  const entryType = type === 'Link' ? linkType : type;

  if (!data[entryType]) {
    data[entryType] = new Map();
  }

  if (!data[entryType].has(id)) {
    data[entryType].set(id, { cb, updated: updatedAt, published: publishedAt });
  }

  if (!running) {
    run(sdk, interval);
  }

  return () => {
    running = false;
    clearTimeout(timeout);
  };
};

/**
 * Unsubscribe from watcher
 * @param {object} obj Contentful item
 */
export const _unsubscribe = obj => {
  if (!obj) {
    data.Asset.clear();
    data.Entry.clear();
  }

  const { sys } = obj || {};
  const { id, type } = sys || {};

  if (data[type] && data[type].has(id)) {
    data[type].delete(id);
  }
};

export const subscribe = (sdk, obj, cb, interval = OBSERVER_INTERVAL) => internalSubscribe(sdk, obj, cb);
export const unsubscribe = (obj, cb) => internalUnsubscribe(obj, cb);
