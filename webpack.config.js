var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  // entry: ['babel-polyfill', './showy.webpack.js'],
  entry: ['babel-polyfill', './src/showy.js'],
  output: {
    library: 'Showy',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'showy.pkgd.min.js',
  },
  plugins: [
    new webpack.ProvidePlugin({
      _: 'lodash',
      pica: 'pica/dist/pica',
      createTexture: 'gl-texture2d',
      createTransition: 'glsl-transition',
      eases: 'eases',
    }),
  ],
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
};
