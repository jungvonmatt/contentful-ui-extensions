import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import styled from 'styled-components';
import relativeDate from 'relative-date';
import { useContentful } from '@jungvonmatt/contentful-common/hooks';

import { Button } from '@contentful/forma-36-react-components/dist/components/Button/Button';
import { Paragraph } from '@contentful/forma-36-react-components/dist/components/Typography/Paragraph/Paragraph';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';

const Container = styled.div``;

const App = () => {
  const sdk = useContentful();
  const { space, entry, notifier, dialogs } = sdk;
  const updatedAt = entry.getSys().updatedAt;

  const [busy, setBusy] = useState(false);
  const [ago, setAgo] = useState(updatedAt ? relativeDate(Date.parse(updatedAt)) : 'never');

  const onError = error => {
    setBusy(false);
    notifier.error(error.message);
  };

  const onUpdate = () => {
    setBusy(false);
    setAgo(relativeDate(Date.now()));
  };

  const onClickDeploy = async () => {
    setBusy(true);

    const _sys = entry.getSys();
    const _entry = await space.getEntry(_sys.id);

    const title = 'Deployment';
    const message = 'All published entries will be deployed and become available on the environment.';
    const confirmLabel = 'Deploy';

    const result = await dialogs.openConfirm({
      title,
      message,
      confirmLabel,
      cancelLabel: 'Cancel',
    });

    if (!result) {
      setBusy(false);
      return;
    }

    try {
      console.log({ space, _entry });
      await space.publishEntry(_entry);
      onUpdate();
    } catch (error) {
      onError(error);
    }
  };

  return (
    <Container>
      <Button buttonType="positive" isFullWidth={true} onClick={() => onClickDeploy()} disabled={busy} loading={busy}>
        Deploy
      </Button>
      <Paragraph className="f36-margin-top--s">Last deployed {ago}</Paragraph>
    </Container>
  );
};

export default App;
