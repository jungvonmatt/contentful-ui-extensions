import isPlainObject from 'is-plain-object';
import { mapAsync, reduceAsync } from './array';

export const deepAwait = async val => {
  if (Array.isArray(val)) {
    return mapAsync(val, async v => await deepAwait(v));
  } else if (typeof val === 'function') {
    return await val();
  } else if (isPlainObject(val)) {
    return reduceAsync(
      Object.keys(val),
      async (res, key) => ({
        ...res,
        [key]: await deepAwait(val[key]),
      }),
      {}
    );
  }
  return await val;
};
