/**
 * Simple cache to not load an asset twice in one session
 *
 * Copyright (c) Jung von Matt/TECH
 */
import lscache from 'lscache';

const TTL = 30;
const BUCKET_ENTRIES = 'entries-';
const BUCKET_TYPES = 'content-types-';
/**
 * Try to retrieve asset from cache
 * @param {object} space SDKs space
 * @param {string} id Entity id
 * @returns {object} contentful entity
 */
export const getCachedAsset = async (space, id) => {
  lscache.setBucket(BUCKET_ENTRIES);
  if (!lscache.get(id)) {
    const asset = await space.getAsset(id);
    lscache.set(id, asset, TTL);
  }

  return lscache.get(id);
};

/**
 * Try to retrieve entry from cache
 * @param {object} space SDKs space
 * @param {string} id Entity id
 * @returns {object} contentful entity
 */
export const getCachedEntry = async (space, id) => {
  lscache.setBucket(BUCKET_ENTRIES);
  if (!lscache.get(id)) {
    const entry = await space.getEntry(id);
    lscache.set(id, entry, TTL);
  }

  return lscache.get(id);
};

/**
 * Try to retrieve entry from cache
 * @param {object} space SDKs space
 * @param {string} id Entity id
 * @returns {object} contentful entity
 */
export const getCachedContentType = async (space, id) => {
  lscache.setBucket(BUCKET_TYPES);
  if (!lscache.get(id)) {
    const result = await space.getContentTypes();
    (result.items || []).forEach(entry => {
      const { sys, ...values } = entry;
      lscache.set(sys.id, { ...values, id: sys.id }, 60);
    });
  }

  return lscache.get(id);
};

/**
 * Store entity
 * @param {string} id Entity id
 * @param {object} entity Contentful entity
 */
export const store = (id, entity) => {
  lscache.setBucket(BUCKET_ENTRIES);
  lscache.set(id, entity, TTL);
};
