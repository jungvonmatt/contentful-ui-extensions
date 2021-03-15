import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import styled from 'styled-components';
import { useContentful } from '@jungvonmatt/contentful-common/hooks';
import { CheckboxField, HelpText, TextInput, Flex } from '@contentful/forma-36-react-components';

import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';

const Container = styled.div``;

const EXTENSION_NAME = 'hyphen-input';

const App = () => {
  const sdk = useContentful();
  const { field, parameters } = sdk;
  const { id } = field;
  const [value, setValue] = useState(field.getValue() || { text: '', hyphens: true });
  const [error, setError] = useState(false);
  const { text = '', hyphens = true } = value || {};
  const [charCount, setCharCount] = useState(text.length);

  const { instance } = parameters || {};
  const { maxLength = 256 } = instance || {};

  const removeShy = string => string.replace(/&shy;/gim, '');
  const getLength = string => removeShy(string).length;

  const setText = text => {
    setCharCount(getLength(text));
    setValue(value => ({ ...value, text }));
  };

  const setHyphens = hyphens => {
    setValue(value => ({ ...value, hyphens }));
  };

  useEffect(() => {
    if (value && value.text) {
      field.setValue({ ...value, type: EXTENSION_NAME });
    } else {
      setCharCount(0);
      field.removeValue();
    }
  }, [value]);

  useEffect(() => {
    field.setInvalid(error);
  }, [error]);

  const validate = event => {
    const cnt = getLength(event.target.value);
    setError(cnt >= maxLength);
  };

  return (
    <Container>
      <TextInput
        value={text}
        error={error}
        onChange={event => {
          validate(event);
          setText(event.target.value);
        }}
        onKeyPress={validate}
        id={id}
        name={id}
      />
      <Flex justifyContent="space-between">
        <CheckboxField
          onChange={event => setHyphens(event.target.checked)}
          checked={hyphens}
          style={{ marginTop: '0.5rem' }}
          labelText="Hyphens auto"
        />
        <HelpText error={error}>{`${charCount}/${maxLength} characters`}</HelpText>
      </Flex>
    </Container>
  );
};

export default App;
