var path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: ['babel-polyfill', './showy.webpack.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'showy.js',
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
};
