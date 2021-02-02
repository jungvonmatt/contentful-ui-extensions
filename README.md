# JvM Contentful UI Extensions

A collection of [Contentful UI Extensions](https://www.contentful.com/developers/docs/concepts/uiextensions/) developed and used by [JvM/TECH](https://www.jvm.tech). <br/>
Includes tooling to quickly bootstrap a new extension.

## Development

This [quick introduction](https://www.contentful.com/developers/docs/concepts/uiextensions/) is a good place to get started with UI extensions. For more advanced and creative use cases, read this [blog post](https://www.contentful.com/blog/2017/10/09/creating-ui-extensions-with-contentful/).

### API Reference

Refer to the [official SDK documentation](https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/) for a list of available methods.

### Getting started

We use [`lerna`](https://github.com/lerna/lerna) and [`yarn` workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) under the hood to make developing and publishing our extensions a breeze.
Run `yarn bootstrap` to install all the dependencies & [bootstrap](https://github.com/lerna/lerna#bootstrap) all packages for development.

```bash
yarn bootstrap
```

This command will install the dependencies for all packages and link any cross-dependencies.
It also tries to link to a specific space in your contentful account.

### Configure contentful

```bash
yarn cf:login
```

Starts new session with our CLI. As the Contentful CLI tool uses our Content Management API, you need to have an CMA access token to use all the commands.

```bash
yarn cf:logout
```

Ends your current session with the Contentful CLI tool.

```bash
yarn cf:configure
```

Asks which Contentful space and environment you want to use for development and deployment.

### Create extension

```bash
yarn create-extension <extension-id>
```

### Local dev

We use [`webpack`](https://webpack.js.org) for development and to bundle the extension. To start a development server with automatic reloading, run the following command:

```bash
yarn dev [--scope <extension-name>]

yarn dev
yarn dev --scope @jungvonmatt/multi-text
```

The development server generates a self-signed certificate to enable a secure `https` connection. This is important to get the extensions to work with Contentful's CSP policy. The first time you load the extension, you will likely get a security error. Simply add an exception for this certificate.

### SSL certificate

You can use [mkcert](https://github.com/FiloSottile/mkcert) to generate a dev certificate for you so you don't have to accept the "goto unsafe domain" every time.

```bash
brew install mkcert
brew install nss
mkcert -install
mkdir cert && mkcert -cert-file 'cert/localhost.cert' -key-file 'cert/localhost.key' localhost
```

Webpack will automatically pick up the certificate files.

### Publishing to Contentful

During development, the extension is served from `https://localhost:8080`. Once your extension is finished, you can publish it to Contentful by running the following command:

```bash
yarn deploy [--scope <extension-name>]

yarn deploy
yarn deploy --scope @jungvonmatt/multi-text
```

Visit the [Contentful CLI docs](https://github.com/contentful/contentful-cli/tree/master/docs/extension) for more up-to-date instructions to publish, update or manage the UI extensions on Contentful.
