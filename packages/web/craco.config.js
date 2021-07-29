const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const PnpWebpackPlugin = require(`pnp-webpack-plugin`);

module.exports = {
  resolve: {
    plugins: [PnpWebpackPlugin],
  },
  resolveLoader: {
    plugins: [PnpWebpackPlugin.moduleLoader(module)],
  },
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          webpackConfig.resolve.plugins = webpackConfig.resolve.plugins
            .filter(({ constructor }) => {
              if (!constructor) return true;
              return constructor.name !== 'ModuleScopePlugin';
            })
            .concat(new TsconfigPathsPlugin());

          // webpackConfig.module.rules.push({
          //   test: /\.tsx?$/,
          //   loader: 'esbuild-loader',
          //   options: {
          //     loader: 'tsx',
          //     target: 'es2015',
          //   },
          // });

          return webpackConfig;
        },
      },
    },
  ],
};
