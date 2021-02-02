import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import styled from 'styled-components';
import { useContentful } from '@jungvonmatt/contentful-common/hooks';

const Container = styled.div``;

const App = () => {
  const sdk = useContentful();
  const { field } = sdk;
  const [value, setValue] = useState(field.getValue());
  useEffect(() => {
    if (value) {
      field.setValue(value);
    } else {
      field.removeValue();
    }
  }, [value]);

  return <Container></Container>;
};

export default App;
