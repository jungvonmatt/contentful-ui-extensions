// import React from 'preact/compat';
import { h, render } from 'preact';
import { ContentfulProvider } from '@jvm/contentful-common/context';
import App from './components/app';

// When UI Extensions SDK is loaded the callback will be executed.
window.contentfulExtension.init(initExtension);

/**
 * initExtension is called by the contentful ui extension sdk after initialization
 * "sdk" is providing an interface documented here:
 * https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/
 *
 * @param {Object} sdk The contentful ui extension sdk
 */
function initExtension(sdk) {
  // Automatically adjust UI Extension size in the Web App.
  sdk.window.updateHeight();
  sdk.window.startAutoResizer();

  // Initialize provider & start the app
  render(
    <ContentfulProvider sdk={sdk}>
      <App />
    </ContentfulProvider>,
    document.getElementById('root')
  );
}
