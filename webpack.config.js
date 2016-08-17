var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  entry: './showy.js',
  output: {
    library: 'Showy',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'showy.pkgd.js',
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
