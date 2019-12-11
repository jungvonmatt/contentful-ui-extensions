import { useEffect, useState, useRef, useContext } from 'react';
import { isEqual } from '../helper/entity';

import { ContentfulContext } from '../context';

// HOC providing page & config props
export const useContentful = () => useContext(ContentfulContext);

export const usePrevious = value => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const useValueChanged = (field, handler) => {
  const savedHandler = useRef();
  const valueRef = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = value => {
      if (!isEqual(valueRef.current, value)) {
        savedHandler.current(value);
      }
      valueRef.current = value;
    };
    return field.onValueChanged(listener);
  }, [field, valueRef]);
};

export const useContentTypes = (space, regexp = /.*/) => {
  const [contentTypes, setContentTypes] = useState([]);

  useEffect(() => {
    space.getContentTypes().then(response => {
      const contentTypes = response.items.map(contentType => {
        const { name, sys } = contentType || {};
        const { id } = sys || {};
        return { name, id };
      });
      setContentTypes(contentTypes.filter(({ id }) => regexp.test(id)));
    });
  }, []);

  return contentTypes;
};
