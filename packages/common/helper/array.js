export async function mapAsync(array = [], callback = a => a) {
  const result = [];
  if (!Array.isArray(array)) {
    return [];
  }
  for (const index of array.keys()) {
    const mapped = await callback(array[index], index, array); /* eslint-disable-line no-await-in-loop */
    result.push(mapped);
  }

  return result;
}

export async function forEachAsync(array = [], callback = () => {}) {
  if (Array.isArray(array)) {
    for (const index of array.keys()) {
      await callback(array[index], index, array); /* eslint-disable-line no-await-in-loop */
    }
  }
}

export async function filterAsync(array = [], filter = a => a) {
  const result = [];
  if (Array.isArray(array)) {
    for (const index of array.keys()) {
      const active = await filter(array[index], index, array); /* eslint-disable-line no-await-in-loop */
      if (active) {
        result.push(array[index]);
      }
    }
  }
  return result;
}

export async function reduceAsync(array = [], reducer = r => r, initial) {
  if (!Array.isArray(array)) {
    return initial;
  }
  for (const index of array.keys()) {
    initial = await reducer(initial, array[index], index); /* eslint-disable-line no-await-in-loop */
  }

  return initial;
}
