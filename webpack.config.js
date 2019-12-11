require = require('@std/esm')(module, { cjs: true, mode: 'all' });
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const globby = require('globby');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { deepAwait } = require('@jvm/contentful-common/helper/promise');

const pkg = require(path.join(process.cwd(), 'package.json'));

const env = process.argv.includes('-p') || process.env.NODE_ENV === 'production' ? 'production' : 'development';
const serve =
  process.argv.includes('serve') || process.argv.includes('--serve') || process.argv[1].includes('webpack-dev-server');
const debug = process.argv.includes('debug') || process.argv.includes('--debug');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = env;
}

const config = {
  context: process.cwd(),
  entry: {
    index: path.join(process.cwd(), 'src/index.js'),
  },
  output: {
    path: path.resolve(process.cwd(), 'dist'),
    filename: 'index.js',
  },
  plugins: [new webpack.EnvironmentPlugin(['NODE_ENV'])],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.resolve(__dirname, 'babel.config.js'),
          },
        },
      },
    ],
  },

  resolve: {
    alias: {
      react: 'preact/compat',
      react$: 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom$': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
    },
  },
};

if (env != 'production') {
  config.devtool = 'inline-source-map';
}

if (!serve) {
  config.plugins = [
    ...config.plugins,
    // new HtmlWebpackPlugin({
    //   template: path.join(process.cwd(), 'src/index.html'),
    //   inject: false,
    // }),
    // new ScriptExtHtmlWebpackPlugin({
    //   inline: '*',
    // }),
  ];
}

// DEBUG
if (debug) {
  config.plugins = [...config.plugins, new BundleAnalyzerPlugin()];
}

// SERVE
if (serve) {
  const getPackages = async () => {
    const packages = await globby(['*', '!common'], { cwd: path.join(__dirname, 'packages'), onlyDirectories: true });
    return packages.map(name => ({ name, path: path.join(__dirname, 'packages', name) }));
  };

  config.context = path.join(__dirname, 'packages');

  config.entry = async () => {
    const packages = await getPackages();
    return packages.reduce(
      (entries, entry) => ({
        ...entries,
        [entry.name]: [
          `${entry.path}/src/index.js`,
          'webpack/hot/only-dev-server',
          'webpack-dev-server/client?https://0.0.0.0:8080',
        ],
      }),
      {}
    );
  };

  config.output = {
    path: path.join(__dirname, 'packages'),
    filename: '[name]/src/index.js',
  };

  config.devServer = {
    contentBase: path.join(__dirname, 'packages'),
    https: true,
  };

  if (fs.existsSync(`${__dirname}/cert/localhost.cert`)) {
    config.devServer.cert = `${__dirname}/cert/localhost.cert`;
  }

  if (fs.existsSync(`${__dirname}/cert/localhost.key`)) {
    config.devServer.key = `${__dirname}/cert/localhost.key`;
  }
}

// (async () => {
//   console.log('DEBUG');
//   console.log(__dirname);
//   const c = await deepAwait(config);
//   console.log(c);
//   process.exit(0);
// })();

module.exports = () => deepAwait(config);
