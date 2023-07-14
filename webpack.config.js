const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackPrettierPlugin = require('webpack-prettier-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const yaml = require('js-yaml');

if (!fs.existsSync('./foundryConfig.json')) {
  console.log('*** No config file found, creating new copy. ***');
  fs.writeFileSync(
    './foundryConfig.json',
    JSON.stringify({ deployDest: './release' })
  );
} else {
  console.log('*** Found foundryConfig.json ***');
}
const config = require('./foundryConfig.json');

const getBuild = (isDev) => ({
  entry: {
    module: './module/burningwheel.ts',
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { url: false, sourceMap: isDev },
          },
          { loader: 'sass-loader', options: { sourceMap: isDev } },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.ts', '.js'],
  },
  output: {
    filename: 'burningwheel.js',
    path: path.resolve(__dirname, config.deployDest),
  },
  devtool: isDev ? 'source-map' : undefined,
  plugins: [
    new MiniCssExtractPlugin({ filename: 'burningwheel.css' }),
    new WebpackPrettierPlugin(),
    new ESLintPlugin({
      extensions: ['ts'],
    }),
    new CopyPlugin({
      patterns: [
        { from: 'system.json' },
        { from: 'templates/**/*.hbs' },
        {
          from: 'node_modules/select2/dist/js/select2.min.js',
          to: 'lib/select2',
        },
        {
          from: 'node_modules/select2/dist/css/select2.min.css',
          to: 'lib/select2',
        },
        {
          from: '**/*.yml',
          to: '[path][name].json',
          transform(content) {
            return Buffer.from(
              JSON.stringify(
                yaml.load(content.toString('utf8'), {
                  schema: yaml.JSON_SCHEMA,
                })
              )
            );
          },
        },
      ],
    }),
  ],
});

module.exports = (env, argv) => {
  console.log(`building in ${argv.mode}`);
  return getBuild(argv.mode === 'production');
};
