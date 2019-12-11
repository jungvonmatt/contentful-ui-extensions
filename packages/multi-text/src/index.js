import React from 'react';
import { render } from 'react-dom';
import { ContentfulProvider } from '@jvm/contentful-common/context';
import App from './App';

// When UI Extensions SDK is loaded the callback will be executed.
window.contentfulExtension.init(initExtension);
function initExtension(sdk) {
  // "extension" is providing an interface documented here:
  // https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/

  // Automatically adjust UI Extension size in the Web App.
  sdk.window.updateHeight();
  sdk.window.startAutoResizer();

  render(
    <ContentfulProvider sdk={sdk}>
      <App />
    </ContentfulProvider>,
    document.getElementById('root')
  );
}
