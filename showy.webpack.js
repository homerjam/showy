require('expose-loader?createTexture!gl-texture2d');
require('expose-loader?createTransition!glsl-transition');
require('expose-loader?eases!eases');

var Showy = require('babel-loader?presets[]=es2015!./src/showy').default;
Showy.DefaultTransitions = require('babel-loader?presets[]=es2015!./src/transitions').default;

module.exports = Showy;
