module.exports = function(api) {
  api.cache(true);

  const presets = [
    [
      '@babel/preset-env',
      {
        useBuiltIns: false,
        modules: false,
      },
    ],
    [
      '@babel/preset-react',
      {
        useBuiltIns: true,
      },
    ],
  ];
  const plugins = [
    'babel-plugin-styled-components',
    [
      '@babel/plugin-proposal-class-properties',
      {
        loose: true,
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: false,
        regenerator: true,
      },
    ],
  ];

  return {
    presets,
    plugins,
  };
};
