import React from 'react';
import { resolve, isEntity, getValues } from '../helper/entity';
import { getCachedEntry, getCachedAsset, getCachedContentType, store } from '../helper/cache';
import { subscribe, unsubscribe } from '../helper/observer';

// React context with initial state
export const ContentfulContext = React.createContext({
  field: undefined,
  space: undefined,
  dialogs: undefined,
  entry: undefined,
  contentType: undefined,
  parameters: undefined,
  locales: undefined,
  getEntry: () => {},
  getAsset: () => {},
  getDisplayTitle: () => {},
});

/**
 * HOC retunring a entry load helper function
 * Resolve entry as contentful won't resolve multiple levels deep
 * Loads entry if id is passed in and otherwise uses the passed entry
 *
 * @param {object} sdk Contentful API
 */
const getEntry = sdk => async (entryOrId, config) => {
  if (isEntity(entryOrId)) {
    return resolve(sdk, entryOrId, config);
  }
  const { space } = sdk;
  const entry = await getCachedEntry(space, entryOrId);
  return resolve(sdk, entry, config);
};

const getContentType = sdk => entryOrId => {
  const { space } = sdk;
  let id = entryOrId;
  if (isEntity(entryOrId)) {
    id = entryOrId.sys.id;
  }

  return getCachedContentType(space, id);
};

/**
 * HOC retunring a helper function to fetch the display field
 * Resolve entry as contentful won't resolve multiple levels deep
 * Loads entry if id is passed in and otherwise uses the passed entry
 *
 * @param {object} sdk Contentful API
 */
const getDisplayTitle = sdk => async (entryOrId, locale) => {
  const { space } = sdk;
  if (!isEntity(entryOrId)) {
    entryOrId = await getCachedEntry(space, entryOrId);
  }

  const entity = await resolve(sdk, entryOrId, { locale, depth: 0 });
  const ct = await getContentType(sdk)(entryOrId.sys.contentType);

  if (entryOrId && ct) {
    const { displayField = '-' } = ct;
    const { [displayField]: title } = entity.fields || {};
    return title;
  }

  return 'Untitled';
};

/**
 * HOC retunring a entry load helper function
 * Resolve asset as contentful won't resolve multiple levels deep
 * Loads asset if id is passed in and otherwise uses the passed asset
 *
 * @param {object} sdk Contentful API
 */
const getAsset = sdk => async (entryOrId, config) => {
  if (isEntity(entryOrId)) {
    return resolve(sdk, entryOrId, config);
  }
  const { space } = sdk;
  const asset = await getCachedAsset(space, entryOrId);
  return resolve(sdk, asset, config);
};

/**
 * HOC returning the watcher function.
 * Stores changed assets in the internal cache and calls the callback
 */
const getObserver = sdk => (entity, cb, interval = 2000) => {
  subscribe(
    sdk,
    entity,
    obj => {
      const { sys } = obj || {};
      const { id } = sys || {};
      if (id) {
        store(id, obj);
      }
      cb(obj);
    },
    interval
  );

  return () => unsubscribe(entity);
};

/**
 * HOC returning a getValue function.
 */
const getValue = ({ locales }) => (entity, locale) => getValues(entity, locales, locale);

const getSdkAddons = sdk => ({
  getEntry: getEntry(sdk),
  getAsset: getAsset(sdk),
  getValue: getValue(sdk),
  getContentType: getContentType(sdk),
  subscribe: getObserver(sdk),
  getDisplayTitle: getDisplayTitle(sdk),
  unsubscribe,
});

// Query all the things and return the provider provider
// Is used in the page template which surrounds all things so every component has access to the data
export const ContentfulProvider = props => {
  const { sdk } = props;
  return (
    <ContentfulContext.Provider value={{ ...sdk, ...getSdkAddons(sdk) }}>{props.children}</ContentfulContext.Provider>
  );
};

// HOC providing page & config props
export const withContentful = Component => props => (
  <ContentfulContext.Consumer>
    {sdk => <Component {...props} sdk={{ ...sdk, ...getSdkAddons(sdk) }} />}
  </ContentfulContext.Consumer>
);
