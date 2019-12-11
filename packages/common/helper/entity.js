/**
 * Helper methods for dealing with entities
 *
 * Copyright (c) Jung von Matt/TECH
 */

import equal from 'shallow-equal/arrays';
import { reduceAsync, mapAsync } from './array';
import { getCachedEntry, getCachedAsset } from './cache';

const TYPE_LINK = 'Link';
const TYPE_ASSET = 'Asset';
const TYPE_ENTRY = 'Entry';

/**
 * Lifecycle status
 */
export const status = {
  PUBLISHED: 'published',
  CHANGED: 'changed',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
};

/**
 * Check if the passed object looks lika a regular contentful entity (entry or asset)
 * @param {object} entity Contentful entity
 * @returns {boolean}
 */
export const isEntity = obj =>
  Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).includes('sys');

/**
 * Get localized values for entity
 * @param {object} entity Contentful entity
 * @param {object} locales Contentful locales object providing the default locale
 * @param {string} Locale desired locale
 * @returns {object}
 */
export const getValues = (entity, locales, locale) => {
  const { sys = {}, fields = {} } = entity || {};

  const reduceFields = fields =>
    Object.keys(fields || {}).reduce((res, key) => {
      const { [key]: field } = fields || {};
      const { [locale]: localizedField, [locales && locales.default]: localizedFallback } = field || {};

      return { ...res, [key]: localizedField || localizedFallback || field };
    }, {});

  if (Array.isArray(fields)) {
    return fields.map(data => reduceFields(data));
  }

  return reduceFields(fields);
};

/**
 * Get localized Entry (with sys folder)
 * @param {object} entity Contentful entity
 * @param {object} locales Contentful locales object providing the default locale
 * @param {string} Locale desired locale
 * @returns {object}
 */
export const getLocalized = (entity, locales, locale) => {
  const { sys = {}, fields = {} } = entity || {};

  const reduceFields = fields =>
    Object.keys(fields || {}).reduce((res, key) => {
      const { [key]: field } = fields || {};
      const { [locale]: localizedField, [locales && locales.default]: localizedFallback } = field || {};

      return { ...res, [key]: localizedField || localizedFallback || field };
    }, {});

  if (Array.isArray(fields)) {
    return fields.map(data => reduceFields(data));
  }

  const localizedSys = reduceFields(sys) || {};
  const localizedFields = reduceFields(fields) || {};

  return { sys: localizedSys, fields: localizedFields };
};

/**
 * Extract an entity's content type
 * @param {object} entity Contentful entity
 * @returns {object}
 */
export const getContentType = entity => {
  const { sys } = entity || {};
  const { contentType } = sys || {};

  return contentType;
};

/**
 * Extract an entity's content type id
 * @param {object} entity Contentful entity
 * @returns {string}
 */
export const getContentTypeId = entity => {
  const ct = getContentType(entity);
  const { sys } = ct || {};
  const { id } = sys || {};

  return id;
};

/**
 * Get the entries/assets lifecycle status.
 * @param {object} entity Contentful entity
 * @returns {string} One of ['published','changed','draft','archived']
 */
export const getStatus = entity => {
  const { sys } = entity || {};
  const { archivedVersion, publishedVersion, publishedAt, updatedAt } = sys || {};
  const publishDate = new Date(publishedAt);
  const updateDate = new Date(updatedAt);

  if (archivedVersion) {
    return status.ARCHIVED;
  }

  if (!publishedVersion) {
    return status.DRAFT;
  }

  if (updateDate.getTime() > publishDate.getTime()) {
    return status.CHANGED;
  }

  return status.PUBLISHED;
};

export const mapIds = entites => (entites || []).map(({ sys = {} }) => sys.id);
export const isEqual = (a, b) => equal(mapIds(a), mapIds(b));

/**
 * Convert entity to link which can be stored as reference
 * @param {object} entity
 * @returns {object} Link representation
 */
export const convertToLink = entity => {
  const { sys } = entity || {};
  const { type: linkType, id } = sys;
  return { sys: { type: 'Link', linkType, id } };
};

/**
 * Resolve all connected entities.
 * We need this because the SDK methods don't support the include parameter
 * to retrieve the linked items
 * @param {object} sdk Contentful extensions SDK
 * @param {object} entity Contentful entity
 * @param {object} config Config object
 * @returns {object} Fully resolved entity
 */
export const resolve = async (sdk, entity, config = {}) => {
  const { depth = Infinity, locale } = config;
  const { space, locales } = sdk;
  const { sys } = entity || {};
  const { id, type, linkType } = sys || {};

  // Stop if it's an scalar value or if we already got to the desired depth
  if (!isEntity(entity) || (type === TYPE_LINK && depth < 0)) {
    return entity;
  }

  // Resolve linked asset
  if (type === TYPE_LINK && linkType === TYPE_ASSET) {
    const asset = await getCachedAsset(space, id);
    return await resolve(sdk, asset, { depth: depth - 1, locale });
  }

  // Resolve linked entry
  if (type === TYPE_LINK && linkType === TYPE_ENTRY) {
    const entry = await getCachedEntry(space, id);
    return await resolve(sdk, entry, { depth: depth - 1, locale });
  }

  // Get all localized fields and check if we have some references which need to be resolved
  const { fields: fieldsRaw } = getLocalized(entity, locales, locale);
  const fields = await reduceAsync(
    Object.keys(fieldsRaw || {}),
    async (res, key) => {
      const { [key]: value } = fieldsRaw;

      if (isEntity(value)) {
        return { ...res, [key]: await resolve(sdk, value, { depth: depth - 1, locale }) };
      }

      if (Array.isArray(value)) {
        const mapped = await mapAsync(value, v => resolve(sdk, v, { depth: depth - 1, locale }));
        return { ...res, [key]: mapped };
      }

      return { ...res, [key]: value };
    },
    {}
  );

  return { sys, fields };
};

export const getLinkObject = async (sdk, obj) => {
  const entry = await resolve(sdk, obj);
  const ctId = getContentTypeId(entry);

  if (/^t_/.test(ctId)) {
    const { sys, fields } = entry;
    const { [ctId]: defaultCategory = '' } = {
      t_article: 'blog',
      t_product: 'geldanlage',
    };
    const { id } = sys || {};
    const { title, name, slug, category = defaultCategory } = fields || {};
    const href = category ? `/${category}/${slug}` : `/${slug}`;

    return { id, title: name || title, href, slug, category, target: '_self', type: 'internal' };
  } else if (ctId === 'o_dialog') {
    const { sys, fields } = entry;
    const { id } = sys || {};
    const { title } = fields || {};
    const result = { id, type: 'dialog', target: '_self', title };
    if (!id) {
      return result;
    }

    return { ...result, href: `#dialog:${id}` };
  } else if (/^h_(external)?Link/i.test(ctId)) {
    const { sys, fields } = entry;
    const { id } = sys || {};
    const { title, url: href, reference, useBlank, query } = fields || {};
    let result = { id, href, type: 'external' };
    if (reference) {
      result = await getLinkObject(sdk, reference);
    }

    return { ...result, id, query, title, target: useBlank ? '_blank' : '_self' };
  }

  return {};
};
