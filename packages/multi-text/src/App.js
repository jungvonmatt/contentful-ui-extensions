import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import TextInput from '@contentful/forma-36-react-components/dist/components/TextInput';
import '@contentful/forma-36-react-components/dist/styles.css';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';
import { useContentful } from '@jvm/contentful-common/hooks';

import DragHandle from './components/DragHandle';

const Container = styled.div``;

const Input = styled(TextInput)``;

const Handle = sortableHandle(DragHandle);

const PlusIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>
);

const Plus = styled(PlusIcon)`
  width: 100%;
  height: 100%;
`;

const Cross = styled(Plus)`
  transform: rotate(45deg);
`;

const Delete = styled.button`
  overflow: hidden;
  border: none;
  background: none;
  width: 38px;
  height: 38px;
  cursor: pointer;
  outline: 0;
`;

const Field = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 1rem;
`;

const SortableItem = sortableElement(({ value }) => <div>{value}</div>);
const SortableContainer = sortableContainer(({ children }) => <div>{children}</div>);

const appendEmpty = arr => {
  const val = Array.isArray(arr) ? arr : [arr || ''];

  if (Boolean(val[val.length - 1])) {
    return [...val, ''];
  } else {
    return val;
  }
};

const App = () => {
  const { field, window } = useContentful();
  const fieldValue = field.getValue() || '';
  const initialValue = Array.isArray(fieldValue) ? fieldValue : [fieldValue];

  const { updateHeight = () => {} } = window || {};
  const [values, setValues] = useState(initialValue || ['']);

  const setValue = (index, value) => {
    setValues([...values.slice(0, index), value, ...values.slice(index + 1)]);
  };

  const removeValue = index => {
    setValues([...values.slice(0, index), ...values.slice(index + 1)]);
  };

  useEffect(() => {
    updateHeight();
    const normalized = values.filter(v => Boolean(v));
    field.setValue(normalized);
  }, [values]);

  // // Sortend callback
  const onSortEnd = ({ oldIndex, newIndex }) => {
    const reordered = arrayMove(values || [], oldIndex, newIndex);
    setValues(reordered);
  };

  return (
    <Container>
      <SortableContainer onSortEnd={onSortEnd} useDragHandle lockAxis="y" helperClass="sortable">
        {appendEmpty(values).map((value, index) => {
          const component = (
            <Field key={`value-${index}`}>
              <Handle />
              <Input
                name="tmp[]"
                value={value}
                className="f36-margin-bottom--m"
                onChange={e => {
                  setValue(index, e.target.value);
                }}
              />
              {Boolean(value) && (
                <Delete onClick={() => removeValue(index)}>
                  <Cross />
                </Delete>
              )}
            </Field>
          );
          return <SortableItem key={`item-${index}`} index={index} value={component} />;
        })}
      </SortableContainer>
    </Container>
  );
};

export default App;
